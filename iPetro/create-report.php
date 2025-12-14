<?php
session_start();

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.html');
    exit;
}

// Check session timeout
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
    
    <link rel="stylesheet" href="css/base-style.css">
    <link rel="stylesheet" href="css/home-style.css">
    <link rel="stylesheet" href="css/report-style.css">

    <title>iPetro - Create Inspection Report</title>
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
                    <span style="margin-right: 15px;">Welcome, <?php echo htmlspecialchars($fullName); ?></span>
                    <a href="logout.php" style="color: #fff; font-weight: 600;">Logout</a>
                </li>
            </ul>
        </div>
    </header>

    <div class="container" style="max-width: 1200px;">
        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h1>API 510 Pressure Vessel Inspection</h1>
                <p class="subtitle">Photo-Based Digital Inspection Reporting</p>
            </div>
            <div class="header-actions">
                <button type="button" class="btn-secondary" onclick="window.location.href='home.php'">
                    ← Back to Dashboard
                </button>
            </div>
        </div>

        <!-- Progress Indicator -->
        <div class="progress-indicator">
            <div class="progress-item active">
                <div class="progress-icon">📸</div>
                <div class="progress-text">
                    <strong>Upload Photos</strong>
                    <small id="photoCount">0 photos uploaded</small>
                </div>
            </div>
            <div class="progress-arrow">→</div>
            <div class="progress-item" id="detailsProgress">
                <div class="progress-icon">📝</div>
                <div class="progress-text">
                    <strong>Fill Details</strong>
                    <small id="detailsCount">0 of 0 completed</small>
                </div>
            </div>
            <div class="progress-arrow">→</div>
            <div class="progress-item" id="submitProgress">
                <div class="progress-icon">✅</div>
                <div class="progress-text">
                    <strong>Review & Submit</strong>
                    <small>Final step</small>
                </div>
            </div>
        </div>

        <!-- Step 1: Upload Photos -->
        <div id="uploadSection" class="form-section active">
            <h2 class="section-title">
                <span class="icon">📸</span>
                Step 1: Upload Inspection Photos
            </h2>
            
            <div class="upload-instructions">
                <p><strong>Instructions:</strong> Upload all inspection photos first. Then you'll provide details for each photo individually.</p>
                <ul>
                    <li>✓ Supported formats: JPG, PNG, JPEG</li>
                    <li>✓ Maximum size: 10MB per photo</li>
                    <li>✓ Include reference objects for defect measurement</li>
                </ul>
            </div>

            <div class="upload-section">
                <div class="upload-area" id="uploadArea" onclick="document.getElementById('photoInput').click()">
                    <div class="upload-icon">📁</div>
                    <h3>Click to Upload Photos</h3>
                    <p>or drag and drop files here</p>
                </div>
                <input type="file" id="photoInput" multiple accept="image/jpeg,image/jpg,image/png" style="display: none;" onchange="handleFileSelect(event)">
            </div>

            <div id="photoGallery" class="photo-gallery"></div>

            <div class="form-actions" style="margin-top: 30px;">
                <button type="button" class="btn-primary btn-large" onclick="proceedToDetails()" id="proceedBtn" disabled>
                    Next: Fill Photo Details (0 photos) →
                </button>
            </div>
        </div>

        <!-- Step 2: Fill Details for Each Photo -->
        <div id="detailsSection" class="form-section">
            <h2 class="section-title">
                <span class="icon">📝</span>
                Step 2: Fill Details for Each Photo
            </h2>

            <div class="photo-nav">
                <button type="button" class="btn-nav" onclick="previousPhoto()" id="prevPhotoBtn" disabled>← Previous Photo</button>
                <span class="photo-counter" id="photoCounter">Photo 1 of 0</span>
                <button type="button" class="btn-nav" onclick="nextPhoto()" id="nextPhotoBtn" disabled>Next Photo →</button>
            </div>

            <form id="photoDetailsForm">
                <!-- Current Photo Preview -->
                <div class="current-photo-preview">
                    <img id="currentPhotoImg" src="" alt="Current Photo">
                    <p class="photo-filename" id="currentPhotoName"></p>
                </div>

                <!-- Equipment Information -->
                <div class="form-card">
                    <h3>🏭 Equipment Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Inspection Date <span class="required">*</span></label>
                            <input type="date" class="photo-field" data-field="inspection_date" required>
                        </div>

                        <div class="form-group">
                            <label>Equipment Type <span class="required">*</span></label>
                            <select class="photo-field" data-field="equipment_type" required onchange="handleEquipmentTypeChange(this)">
                                <option value="">-- Select Equipment Type --</option>
                                <option value="Pressure Vessel">Pressure Vessel</option>
                                <option value="Heat Exchanger">Heat Exchanger</option>
                                <option value="Reactor">Reactor</option>
                                <option value="Separator">Separator</option>
                                <option value="Accumulator">Accumulator</option>
                                <option value="Condenser">Condenser</option>
                                <option value="Column/Tower">Column/Tower</option>
                                <option value="Bullet">Bullet</option>
                                <option value="Sphere">Sphere</option>
                                <option value="other">Other (Specify)</option>
                            </select>
                        </div>

                        <div class="form-group" id="otherEquipmentGroup" style="display: none;">
                            <label>Specify Equipment Type</label>
                            <input type="text" class="photo-field" data-field="equipment_type_other" placeholder="Enter equipment type">
                        </div>

                        <div class="form-group">
                            <label>Equipment Tag Number <span class="required">*</span></label>
                            <select class="photo-field" data-field="equipment_tag" required onchange="handleTagChange(this)">
                                <option value="">-- Select Tag --</option>
                                <option value="V-101">V-101 (Pressure Vessel)</option>
                                <option value="HE-205">HE-205 (Heat Exchanger)</option>
                                <option value="R-301">R-301 (Reactor)</option>
                                <option value="S-110">S-110 (Separator)</option>
                                <option value="A-402">A-402 (Accumulator)</option>
                                <option value="C-201">C-201 (Condenser)</option>
                                <option value="other">Other (Specify)</option>
                            </select>
                        </div>

                        <div class="form-group" id="otherTagGroup" style="display: none;">
                            <label>Specify Tag Number</label>
                            <input type="text" class="photo-field" data-field="equipment_tag_other" placeholder="Enter tag number">
                        </div>

                        <div class="form-group">
                            <label>PMT Number <span class="required">*</span></label>
                            <select class="photo-field" data-field="pmt_number" required onchange="handlePMTChange(this)">
                                <option value="">-- Select PMT --</option>
                                <option value="PMT-12345">PMT-12345</option>
                                <option value="PMT-12346">PMT-12346</option>
                                <option value="PMT-12347">PMT-12347</option>
                                <option value="PMT-12348">PMT-12348</option>
                                <option value="PMT-12349">PMT-12349</option>
                                <option value="PMT-12350">PMT-12350</option>
                                <option value="other">Other (Specify)</option>
                            </select>
                        </div>

                        <div class="form-group" id="otherPMTGroup" style="display: none;">
                            <label>Specify PMT Number</label>
                            <input type="text" class="photo-field" data-field="pmt_number_other" placeholder="Enter PMT number">
                        </div>

                        <div class="form-group full-width">
                            <label>Equipment Location <span class="required">*</span></label>
                            <select class="photo-field" data-field="equipment_location" required onchange="handleLocationChange(this)">
                                <option value="">-- Select Location --</option>
                                <option value="Unit 1, Section A">Unit 1, Section A</option>
                                <option value="Unit 1, Section B">Unit 1, Section B</option>
                                <option value="Unit 2, Section A">Unit 2, Section A</option>
                                <option value="Unit 2, Section B">Unit 2, Section B</option>
                                <option value="Unit 3, Processing Area">Unit 3, Processing Area</option>
                                <option value="Storage Area">Storage Area</option>
                                <option value="other">Other (Specify)</option>
                            </select>
                        </div>

                        <div class="form-group full-width" id="otherLocationGroup" style="display: none;">
                            <label>Specify Equipment Location</label>
                            <input type="text" class="photo-field" data-field="equipment_location_other" placeholder="Enter location">
                        </div>
                    </div>
                </div>

                <!-- Inspection Details -->
                <div class="form-card">
                    <h3>🔍 Inspection Details</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Inspection Type <span class="required">*</span></label>
                            <select class="photo-field" data-field="inspection_type" required>
                                <option value="">-- Select Type --</option>
                                <option value="External Inspection">External Inspection</option>
                                <option value="Internal Inspection">Internal Inspection</option>
                                <option value="Nameplate Check">Nameplate Check</option>
                                <option value="Shell/Heads Check">Shell/Heads Check</option>
                                <option value="Weld Inspection">Weld Inspection</option>
                                <option value="Thickness Measurement">Thickness Measurement</option>
                                <option value="Corrosion Assessment">Corrosion Assessment</option>
                                <option value="Accessories Check">Accessories Check</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Inspection Method</label>
                            <select class="photo-field" data-field="inspection_method">
                                <option value="Visual Inspection">Visual Inspection</option>
                                <option value="Ultrasonic Testing (UT)">Ultrasonic Testing (UT)</option>
                                <option value="Radiographic Testing (RT)">Radiographic Testing (RT)</option>
                                <option value="Magnetic Particle Testing (MPT)">Magnetic Particle Testing (MPT)</option>
                                <option value="Liquid Penetrant Testing (LPT)">Liquid Penetrant Testing (LPT)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Defect Information -->
                <div class="form-card">
                    <h3>⚠️ Defect Information (if applicable)</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Defect Found?</label>
                            <select class="photo-field" data-field="defect_found" onchange="toggleDefectFields(this)">
                                <option value="no">No Defect</option>
                                <option value="yes">Yes, Defect Found</option>
                            </select>
                        </div>
                    </div>

                    <div id="defectFields" style="display: none;">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Defect Type</label>
                                <select class="photo-field" data-field="defect_type">
                                    <option value="">-- Select Type --</option>
                                    <option value="Crack">Crack</option>
                                    <option value="Corrosion">Corrosion</option>
                                    <option value="Weld Defect">Weld Defect</option>
                                    <option value="Deformation">Deformation</option>
                                    <option value="Leak">Leak</option>
                                    <option value="Erosion">Erosion</option>
                                    <option value="Pitting">Pitting</option>
                                    <option value="Wall Loss">Wall Loss</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Severity Level</label>
                                <select class="photo-field" data-field="defect_severity">
                                    <option value="Minor">Minor</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="Major">Major</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div class="form-group full-width">
                                <label>Defect Location</label>
                                <select class="photo-field" data-field="defect_location" onchange="handleDefectLocationChange(this)">
                                    <option value="">-- Select Location --</option>
                                    <option value="Shell - Longitudinal Weld">Shell - Longitudinal Weld</option>
                                    <option value="Shell - Circumferential Weld">Shell - Circumferential Weld</option>
                                    <option value="Shell - External Surface">Shell - External Surface</option>
                                    <option value="Shell - Internal Surface">Shell - Internal Surface</option>
                                    <option value="Head - Nozzle Connection">Head - Nozzle Connection</option>
                                    <option value="Head - Weld Joint">Head - Weld Joint</option>
                                    <option value="Support - Base">Support - Base</option>
                                    <option value="Nozzle - Flange">Nozzle - Flange</option>
                                    <option value="other">Other (Specify)</option>
                                </select>
                            </div>

                            <div class="form-group full-width" id="otherDefectLocationGroup" style="display: none;">
                                <label>Specify Defect Location</label>
                                <input type="text" class="photo-field" data-field="defect_location_other" placeholder="Enter defect location">
                            </div>

                            <div class="form-group">
                                <label>Defect Length (mm)</label>
                                <input type="number" class="photo-field" data-field="defect_length" step="0.1" placeholder="0.0">
                            </div>

                            <div class="form-group">
                                <label>Defect Width (mm)</label>
                                <input type="number" class="photo-field" data-field="defect_width" step="0.1" placeholder="0.0">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Findings & Recommendations -->
                <div class="form-card">
                    <h3>📋 Findings & Recommendations</h3>
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label>General Findings</label>
                            <select class="photo-field" data-field="general_findings" onchange="handleFindingsChange(this)">
                                <option value="">-- Select Findings --</option>
                                <option value="Equipment in good condition, no defects observed">Equipment in good condition, no defects observed</option>
                                <option value="Minor corrosion observed, within acceptable limits">Minor corrosion observed, within acceptable limits</option>
                                <option value="Weld integrity satisfactory">Weld integrity satisfactory</option>
                                <option value="Thickness measurements within specification">Thickness measurements within specification</option>
                                <option value="Nameplate legible and intact">Nameplate legible and intact</option>
                                <option value="Surface condition acceptable">Surface condition acceptable</option>
                                <option value="other">Other (Specify)</option>
                            </select>
                        </div>

                        <div class="form-group full-width" id="otherFindingsGroup" style="display: none;">
                            <label>Specify Findings</label>
                            <textarea class="photo-field" data-field="general_findings_other" rows="3" placeholder="Enter detailed findings..."></textarea>
                        </div>

                        <div class="form-group full-width">
                            <label>Recommendations</label>
                            <select class="photo-field" data-field="recommendations" onchange="handleRecommendationsChange(this)">
                                <option value="">-- Select Recommendation --</option>
                                <option value="Continue operation, re-inspect as scheduled">Continue operation, re-inspect as scheduled</option>
                                <option value="Monitor for progression, increase inspection frequency">Monitor for progression, increase inspection frequency</option>
                                <option value="Repair required before next operation">Repair required before next operation</option>
                                <option value="Immediate repair recommended">Immediate repair recommended</option>
                                <option value="Consider replacement in next shutdown">Consider replacement in next shutdown</option>
                                <option value="Apply protective coating">Apply protective coating</option>
                                <option value="Conduct detailed NDT inspection">Conduct detailed NDT inspection</option>
                                <option value="other">Other (Specify)</option>
                            </select>
                        </div>

                        <div class="form-group full-width" id="otherRecommendationsGroup" style="display: none;">
                            <label>Specify Recommendations</label>
                            <textarea class="photo-field" data-field="recommendations_other" rows="3" placeholder="Enter recommendations..."></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="backToUpload()">← Back to Photos</button>
                    <button type="button" class="btn-save" onclick="saveCurrentPhoto()">💾 Save Photo Details</button>
                    <button type="button" class="btn-primary" onclick="saveAndNext()" id="saveNextBtn">Save & Next Photo →</button>
                </div>
            </form>
        </div>

        <!-- Step 3: Review & Submit -->
        <div id="reviewSection" class="form-section">
            <h2 class="section-title">
                <span class="icon">✅</span>
                Step 3: Review & Submit Report
            </h2>

            <div class="review-summary-card">
                <h3>Report Summary</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Photos:</span>
                        <span class="stat-value" id="reviewPhotoCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Photos with Details:</span>
                        <span class="stat-value" id="reviewCompletedCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Inspector:</span>
                        <span class="stat-value"><?php echo htmlspecialchars($fullName); ?></span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Report Date:</span>
                        <span class="stat-value" id="reviewDate"></span>
                    </div>
                </div>
            </div>

            <div id="reviewGrid" class="review-grid"></div>

            <div class="form-actions" style="margin-top: 30px;">
                <button type="button" class="btn-secondary" onclick="backToDetails()">← Back to Details</button>
                <button type="submit" class="btn-success btn-large" onclick="submitReport()" id="finalSubmitBtn">
                    <span class="btn-text">📄 Submit Complete Report</span>
                    <span class="btn-loader" style="display: none;">
                        <span class="spinner"></span>
                        Submitting...
                    </span>
                </button>
            </div>
        </div>
    </div>

    <script src="js/create-report.js"></script>
</body>
</html>