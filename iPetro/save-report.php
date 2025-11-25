<?php
/**
 * iPetro Save Report Handler
 * Processes and saves inspection reports to database
 */

session_start();

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Database configuration
require_once 'db-config.php';

// Get user info
$userId = $_SESSION['user_id'];
$username = $_SESSION['username'];

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $conn = getConnection();
    
    if (!$conn) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // ================================================================
        // STEP 1: Insert Report
        // ================================================================
        
        $equipmentId = intval($_POST['equipment_id']);
        $status = $_POST['status'] ?? 'pending';
        $inspectionDate = $_POST['inspection_date'];
        
        $stmt = $conn->prepare("
            INSERT INTO REPORT (
                created_by_user, 
                equipment_id, 
                status, 
                creation_date,
                submission_date
            ) VALUES (?, ?, ?, NOW(), ?)
        ");
        
        $submissionDate = ($status === 'submitted') ? date('Y-m-d H:i:s') : null;
        $stmt->bind_param("iiss", $userId, $equipmentId, $status, $submissionDate);
        $stmt->execute();
        
        $reportId = $conn->insert_id;
        $stmt->close();
        
        // Generate Report ID
        $reportIdFormatted = 'RPT-' . date('Y') . '-' . str_pad($reportId, 3, '0', STR_PAD_LEFT);
        
        
        // ================================================================
        // STEP 2: Insert Sections
        // ================================================================
        
        // Equipment Information Section
        $equipmentSection = "Equipment Information\n\n";
        $equipmentSection .= "Tag Number: " . ($_POST['equipment_tag'] ?? '') . "\n";
        $equipmentSection .= "PMT Number: " . ($_POST['pmt_number'] ?? '') . "\n";
        $equipmentSection .= "Location: " . ($_POST['equipment_location'] ?? '') . "\n";
        $equipmentSection .= "Description: " . ($_POST['equipment_description'] ?? '') . "\n";
        
        insertSection($conn, $reportId, 'Equipment Information', $equipmentSection, '');
        
        // Inspection Details Section
        $inspectionDetails = "Inspection Type: " . ($_POST['inspection_type'] ?? '') . "\n";
        $inspectionDetails .= "Inspection Method: " . ($_POST['inspection_method'] ?? '') . "\n";
        $inspectionDetails .= "Inspection Date: " . $inspectionDate . "\n\n";
        $inspectionDetails .= "Scope of Inspection:\n" . ($_POST['scope_of_inspection'] ?? '') . "\n\n";
        
        // Add checklist items
        if (isset($_POST['checklist']) && is_array($_POST['checklist'])) {
            $inspectionDetails .= "Checklist Items Completed:\n";
            foreach ($_POST['checklist'] as $item) {
                $inspectionDetails .= "- " . ucwords(str_replace('_', ' ', $item)) . "\n";
            }
        }
        
        insertSection($conn, $reportId, 'Inspection Details', $inspectionDetails, '');
        
        // Findings & Recommendations Section
        $findings = $_POST['general_findings'] ?? '';
        $recommendations = $_POST['recommendations'] ?? '';
        
        insertSection($conn, $reportId, 'Findings & Recommendations', $findings, $recommendations);
        
        
        // ================================================================
        // STEP 3: Process Photos
        // ================================================================
        
        if (isset($_FILES['photos']) && !empty($_FILES['photos']['name'][0])) {
            $uploadDir = 'uploads/inspection_photos/' . $reportId . '/';
            
            // Create directory if not exists
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $photoCount = count($_FILES['photos']['name']);
            
            for ($i = 0; $i < $photoCount; $i++) {
                if ($_FILES['photos']['error'][$i] === UPLOAD_ERR_OK) {
                    $tmpName = $_FILES['photos']['tmp_name'][$i];
                    $fileName = basename($_FILES['photos']['name'][$i]);
                    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                    
                    // Validate file type
                    $allowedTypes = ['jpg', 'jpeg', 'png'];
                    if (!in_array($fileExt, $allowedTypes)) {
                        continue;
                    }
                    
                    // Generate unique filename
                    $newFileName = 'photo_' . time() . '_' . $i . '.' . $fileExt;
                    $uploadPath = $uploadDir . $newFileName;
                    
                    // Move uploaded file
                    if (move_uploaded_file($tmpName, $uploadPath)) {
                        // Insert image record
                        $stmt = $conn->prepare("
                            INSERT INTO IMAGE (
                                section_id, 
                                original_image_path, 
                                caption
                            ) VALUES (
                                (SELECT section_id FROM SECTION WHERE report_id = ? LIMIT 1),
                                ?,
                                ?
                            )
                        ");
                        
                        $caption = "Inspection photo " . ($i + 1);
                        $stmt->bind_param("iss", $reportId, $uploadPath, $caption);
                        $stmt->execute();
                        $stmt->close();
                    }
                }
            }
        }
        
        
        // ================================================================
        // STEP 4: Process Defects
        // ================================================================
        
        if (isset($_POST['defect_type']) && is_array($_POST['defect_type'])) {
            $defectTypes = $_POST['defect_type'];
            $defectSeverities = $_POST['defect_severity'] ?? [];
            $defectLocations = $_POST['defect_location'] ?? [];
            $defectLengths = $_POST['defect_length'] ?? [];
            $defectWidths = $_POST['defect_width'] ?? [];
            $defectDescriptions = $_POST['defect_description'] ?? [];
            
            // Get section_id for defects
            $sectionResult = $conn->query("SELECT section_id FROM SECTION WHERE report_id = $reportId LIMIT 1");
            $section = $sectionResult->fetch_assoc();
            $sectionId = $section['section_id'];
            
            for ($i = 0; $i < count($defectTypes); $i++) {
                if (!empty($defectTypes[$i])) {
                    $defectType = $defectTypes[$i];
                    $location = $defectLocations[$i] ?? '';
                    $description = $defectDescriptions[$i] ?? '';
                    
                    // Build full description
                    $fullDescription = "Type: " . ucwords(str_replace('_', ' ', $defectType)) . "\n";
                    $fullDescription .= "Severity: " . ($defectSeverities[$i] ?? 'N/A') . "\n";
                    
                    if (!empty($defectLengths[$i])) {
                        $fullDescription .= "Length: " . $defectLengths[$i] . " mm\n";
                    }
                    if (!empty($defectWidths[$i])) {
                        $fullDescription .= "Width: " . $defectWidths[$i] . " mm\n";
                    }
                    
                    $fullDescription .= "\nDescription: " . $description;
                    
                    $stmt = $conn->prepare("
                        INSERT INTO DEFECT (
                            section_id,
                            type,
                            location,
                            description
                        ) VALUES (?, ?, ?, ?)
                    ");
                    
                    $stmt->bind_param("isss", $sectionId, $defectType, $location, $fullDescription);
                    $stmt->execute();
                    $stmt->close();
                }
            }
        }
        
        
        // ================================================================
        // STEP 5: Log Activity
        // ================================================================
        
        $action = ($status === 'submitted') ? 'Report submitted for review' : 'Report draft saved';
        
        $stmt = $conn->prepare("
            INSERT INTO ACTIVITY_LOG (
                user_id,
                report_id,
                action,
                timestamp
            ) VALUES (?, ?, ?, NOW())
        ");
        
        $stmt->bind_param("iis", $userId, $reportId, $action);
        $stmt->execute();
        $stmt->close();
        
        
        // Commit transaction
        $conn->commit();
        
        // Success response
        echo json_encode([
            'success' => true,
            'message' => 'Report saved successfully',
            'report_id' => $reportIdFormatted,
            'redirect' => 'home.php'
        ]);
        
    } catch (Exception $e) {
        // Rollback on error
        $conn->rollback();
        
        echo json_encode([
            'success' => false,
            'message' => 'Error saving report: ' . $e->getMessage()
        ]);
    }
    
    $conn->close();
    
} else {
    // Not a POST request
    header('Location: create-report.php');
    exit;
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function insertSection($conn, $reportId, $title, $findings, $recommendations) {
    $stmt = $conn->prepare("
        INSERT INTO SECTION (
            report_id,
            title,
            general_findings,
            recommendations
        ) VALUES (?, ?, ?, ?)
    ");
    
    $stmt->bind_param("isss", $reportId, $title, $findings, $recommendations);
    $stmt->execute();
    $stmt->close();
}


/**
 * ============================================================================
 * EXAMPLE: Fetch Equipment List for Dropdown (AJAX Endpoint)
 * ============================================================================
 * 
 * Create: get-equipment.php
 */

/*
<?php
session_start();

if (!isset($_SESSION['logged_in'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

require_once 'db-config.php';
$conn = getConnection();

$result = $conn->query("
    SELECT 
        equipment_id,
        name,
        tag_num,
        pmt_no,
        type,
        unit
    FROM EQUIPMENT
    ORDER BY name ASC
");

$equipment = [];
while ($row = $result->fetch_assoc()) {
    $equipment[] = $row;
}

echo json_encode($equipment);
$conn->close();
?>
*/


/**
 * ============================================================================
 * EXAMPLE: Update Equipment Dropdown Dynamically
 * ============================================================================
 * 
 * Add to create-report.js:
 */

/*
// Load equipment from database
async function loadEquipmentList() {
    try {
        const response = await fetch('get-equipment.php');
        const equipment = await response.json();
        
        const select = document.getElementById('equipment_id');
        select.innerHTML = '<option value="">-- Select Equipment --</option>';
        
        equipment.forEach(item => {
            const option = document.createElement('option');
            option.value = item.equipment_id;
            option.textContent = `${item.name} (${item.pmt_no})`;
            option.dataset.tag = item.tag_num;
            option.dataset.pmt = item.pmt_no;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading equipment:', error);
    }
}

// Update loadEquipmentDetails() function:
function loadEquipmentDetails() {
    const select = document.getElementById('equipment_id');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        document.getElementById('equipment_tag').value = selectedOption.dataset.tag;
        document.getElementById('pmt_number').value = selectedOption.dataset.pmt;
        document.getElementById('summaryEquipment').textContent = selectedOption.text;
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', function() {
    loadEquipmentList();
    // ... rest of init code
});
*/


/**
 * ============================================================================
 * SECURITY NOTES
 * ============================================================================
 * 
 * 1. File Upload Security:
 *    - Validate file types (whitelist approach)
 *    - Check file size limits
 *    - Use unique filenames to prevent overwrites
 *    - Store uploads outside web root if possible
 *    - Scan for malware (optional)
 * 
 * 2. Input Validation:
 *    - Always validate and sanitize user inputs
 *    - Use prepared statements (already implemented)
 *    - Validate foreign keys exist
 * 
 * 3. Access Control:
 *    - Verify user has permission to create reports
 *    - Check equipment access rights
 * 
 * 4. File Permissions:
 *    - uploads/ directory: 755
 *    - uploaded files: 644
 * 
 * 5. Error Handling:
 *    - Log errors securely
 *    - Don't expose system details to users
 *    - Use try-catch blocks
 */
?>