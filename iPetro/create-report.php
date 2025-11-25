<?php
session_start();

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.html');
    exit;
}

// Check session timeout (30 minutes)
if (isset($_SESSION['login_time'])) {
    if (time() - $_SESSION['login_time'] > 1800) {
        session_destroy();
        header('Location: login.html?timeout=true');
        exit;
    }
}
$_SESSION['login_time'] = time();

// Get user info
$username = $_SESSION['username'];
$fullName = $_SESSION['full_name'];
$role = $_SESSION['role'];
$userId = $_SESSION['user_id'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!--Style-->
    <link rel="stylesheet" href="css/base-style.css">
    <link rel="stylesheet" href="css/dashboard-style.css">
    <link rel="stylesheet" href="css/report-style.css">

    <title>iPetro - Create New Report</title>
</head>
<body>
    <header class="header">
        <a href="home.php">iPetro Reporting System</a>
        <div>
            <ul class="navbar">
                <li><a href="home.php">Home</a></li>
                <li><a href="create-report.php" class="active">Report</a></li>
                <li><a href="track.php">Track</a></li>
                <li><a href="check.php">Check</a></li>
                <li>
                    <span style="margin-right: 15px;">
                        Welcome, <?php echo htmlspecialchars($fullName); ?>
                    </span>
                    <a href="logout.php" style="color: #fff; font-weight: 600;">Logout</a>
                </li>
            </ul>
        </div>
    </header>

    <div class="container" style="max-width: 1200px;">
        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h1>Create New Inspection Report</h1>
                <p class="subtitle">API 510 Pressure Vessel Visual Inspection Report</p>
            </div>
            <div class="header-actions">
                <button type="button" class="btn-secondary" onclick="window.location.href='home.php'">
                    ← Back to Dashboard
                </button>
            </div>
        </div>

        <!-- Progress Indicator -->
        <div class="progress-steps">
            <div class="step active" data-step="1">
                <div class="step-number">1</div>
                <div class="step-label">Equipment Info</div>
            </div>
            <div class="step" data-step="2">
                <div class="step-number">2</div>
                <div class="step-label">Inspection Details</div>
            </div>
            <div class="step" data-step="3">
                <div class="step-number">3</div>
                <div class="step-label">Photos & Defects</div>
            </div>
            <div class="step" data-step="4">
                <div class="step-number">4</div>
                <div class="step-label">Review & Submit</div>
            </div>
        </div>

        <!-- Form Container -->
        <form id="reportForm" action="save-report.php" method="POST" enctype="multipart/form-data">
            
            <!-- Step 1: Equipment Information -->
            <div class="form-section active" data-section="1">
                <h2 class="section-title">
                    <span class="icon">🏭</span>
                    Equipment Information
                </h2>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="equipment_id">Select Equipment <span class="required">*</span></label>
                        <select id="equipment_id" name="equipment_id" required onchange="loadEquipmentDetails()">
                            <option value="">-- Select Equipment --</option>
                            <option value="1">Pressure Vessel V-101 (PMT-12345)</option>
                            <option value="2">Heat Exchanger HE-205 (PMT-12346)</option>
                            <option value="3">Reactor R-301 (PMT-12347)</option>
                            <option value="4">Separator S-110 (PMT-12348)</option>
                            <option value="5">Accumulator A-402 (PMT-12349)</option>
                            <option value="6">Condenser C-201 (PMT-12350)</option>
                        </select>
                        <small class="help-text">Select the equipment being inspected</small>
                    </div>

                    <div class="form-group">
                        <label for="inspection_date">Inspection Date <span class="required">*</span></label>
                        <input type="date" id="inspection_date" name="inspection_date" required>
                    </div>

                    <div class="form-group">
                        <label for="equipment_tag">Equipment Tag Number</label>
                        <input type="text" id="equipment_tag" name="equipment_tag" placeholder="e.g., V-101" readonly>
                    </div>

                    <div class="form-group">
                        <label for="pmt_number">PMT Number</label>
                        <input type="text" id="pmt_number" name="pmt_number" placeholder="e.g., PMT-12345" readonly>
                    </div>

                    <div class="form-group full-width">
                        <label for="equipment_location">Equipment Location</label>
                        <input type="text" id="equipment_location" name="equipment_location" placeholder="e.g., Unit 1, Section A">
                    </div>

                    <div class="form-group full-width">
                        <label for="equipment_description">Equipment Description</label>
                        <textarea id="equipment_description" name="equipment_description" rows="3" placeholder="Brief description of the equipment..."></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-primary" onclick="nextStep()">
                        Next: Inspection Details →
                    </button>
                </div>
            </div>

            <!-- Step 2: Inspection Details -->
            <div class="form-section" data-section="2">
                <h2 class="section-title">
                    <span class="icon">📋</span>
                    Inspection Details
                </h2>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="inspection_type">Inspection Type <span class="required">*</span></label>
                        <select id="inspection_type" name="inspection_type" required>
                            <option value="">-- Select Type --</option>
                            <option value="external">External Inspection</option>
                            <option value="internal">Internal Inspection</option>
                            <option value="both">Internal & External</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="inspection_method">Inspection Method</label>
                        <select id="inspection_method" name="inspection_method">
                            <option value="visual">Visual Inspection</option>
                            <option value="ut">Ultrasonic Testing (UT)</option>
                            <option value="rt">Radiographic Testing (RT)</option>
                            <option value="mpt">Magnetic Particle Testing (MPT)</option>
                            <option value="lpt">Liquid Penetrant Testing (LPT)</option>
                            <option value="multiple">Multiple Methods</option>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label for="scope_of_inspection">Scope of Inspection</label>
                        <textarea id="scope_of_inspection" name="scope_of_inspection" rows="4" placeholder="Describe what was inspected (e.g., shell, heads, nozzles, welds, supports...)"></textarea>
                    </div>

                    <div class="form-group full-width">
                        <label>Inspection Checklist</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="checklist[]" value="nameplate">
                                <span>Nameplate / Identification</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="checklist[]" value="external_shell">
                                <span>External Shell Condition</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="checklist[]" value="welds">
                                <span>Weld Inspection</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="checklist[]" value="corrosion">
                                <span>Corrosion Assessment</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="checklist[]" value="thickness">
                                <span>Thickness Measurement</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="checklist[]" value="accessories">
                                <span>Accessories & Relief Devices</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="prevStep()">
                        ← Previous
                    </button>
                    <button type="button" class="btn-primary" onclick="nextStep()">
                        Next: Photos & Defects →
                    </button>
                </div>
            </div>

            <!-- Step 3: Photos & Defects -->
            <div class="form-section" data-section="3">
                <h2 class="section-title">
                    <span class="icon">📸</span>
                    Upload Inspection Photos
                </h2>

                <div class="upload-section">
                    <div class="upload-area" id="uploadArea" onclick="document.getElementById('photoInput').click()">
                        <div class="upload-icon">📁</div>
                        <h3>Click to Upload Photos</h3>
                        <p>or drag and drop files here</p>
                        <small>Supported: JPG, PNG, JPEG (Max 10MB per file)</small>
                    </div>
                    <input type="file" id="photoInput" name="photos[]" multiple accept="image/jpeg,image/jpg,image/png" style="display: none;" onchange="handleFileSelect(event)">
                </div>

                <div id="photoPreview" class="photo-preview-grid"></div>

                <h2 class="section-title mt-3">
                    <span class="icon">⚠️</span>
                    Defects Found
                </h2>

                <div id="defectsContainer">
                    <div class="defect-entry" data-defect="1">
                        <div class="defect-header">
                            <h4>Defect #1</h4>
                            <button type="button" class="btn-remove" onclick="removeDefect(1)">✕ Remove</button>
                        </div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Defect Type <span class="required">*</span></label>
                                <select name="defect_type[]" required>
                                    <option value="">-- Select Type --</option>
                                    <option value="crack">Crack</option>
                                    <option value="corrosion">Corrosion</option>
                                    <option value="weld_defect">Weld Defect</option>
                                    <option value="deformation">Deformation</option>
                                    <option value="leak">Leak</option>
                                    <option value="erosion">Erosion</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Severity</label>
                                <select name="defect_severity[]">
                                    <option value="minor">Minor</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="major">Major</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label>Defect Location</label>
                                <input type="text" name="defect_location[]" placeholder="e.g., Shell longitudinal weld, Section A-2">
                            </div>
                            <div class="form-group">
                                <label>Length (mm)</label>
                                <input type="number" name="defect_length[]" step="0.1" placeholder="0.0">
                            </div>
                            <div class="form-group">
                                <label>Width (mm)</label>
                                <input type="number" name="defect_width[]" step="0.1" placeholder="0.0">
                            </div>
                            <div class="form-group full-width">
                                <label>Description</label>
                                <textarea name="defect_description[]" rows="2" placeholder="Detailed description of the defect..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="button" class="btn-add" onclick="addDefect()">
                    + Add Another Defect
                </button>

                <div class="form-actions mt-3">
                    <button type="button" class="btn-secondary" onclick="prevStep()">
                        ← Previous
                    </button>
                    <button type="button" class="btn-primary" onclick="nextStep()">
                        Next: Review & Submit →
                    </button>
                </div>
            </div>

            <!-- Step 4: Review & Submit -->
            <div class="form-section" data-section="4">
                <h2 class="section-title">
                    <span class="icon">✅</span>
                    Review & Recommendations
                </h2>

                <div class="form-grid">
                    <div class="form-group full-width">
                        <label for="general_findings">General Findings</label>
                        <textarea id="general_findings" name="general_findings" rows="5" placeholder="Summarize the overall inspection findings..."></textarea>
                    </div>

                    <div class="form-group full-width">
                        <label for="recommendations">Recommendations</label>
                        <textarea id="recommendations" name="recommendations" rows="5" placeholder="Provide recommendations for repairs, maintenance, or further inspection..."></textarea>
                    </div>

                    <div class="form-group">
                        <label for="next_inspection_date">Next Inspection Due Date</label>
                        <input type="date" id="next_inspection_date" name="next_inspection_date">
                    </div>

                    <div class="form-group">
                        <label for="report_status">Report Status</label>
                        <select id="report_status" name="status">
                            <option value="pending">Save as Draft</option>
                            <option value="submitted">Submit for Review</option>
                        </select>
                    </div>
                </div>

                <div class="review-summary">
                    <h3>Report Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <strong>Inspector:</strong>
                            <span><?php echo htmlspecialchars($fullName); ?></span>
                        </div>
                        <div class="summary-item">
                            <strong>Date:</strong>
                            <span id="summaryDate">-</span>
                        </div>
                        <div class="summary-item">
                            <strong>Equipment:</strong>
                            <span id="summaryEquipment">-</span>
                        </div>
                        <div class="summary-item">
                            <strong>Photos Uploaded:</strong>
                            <span id="summaryPhotos">0</span>
                        </div>
                        <div class="summary-item">
                            <strong>Defects Recorded:</strong>
                            <span id="summaryDefects">0</span>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="prevStep()">
                        ← Previous
                    </button>
                    <button type="submit" class="btn-success" id="submitBtn">
                        <span class="btn-text">💾 Submit Report</span>
                        <span class="btn-loader" style="display: none;">
                            <span class="spinner"></span>
                            Submitting...
                        </span>
                    </button>
                </div>
            </div>

        </form>
    </div>

    <!-- Include Chart.js for potential future use -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <script src="js/create-report.js"></script>
</body>
</html>