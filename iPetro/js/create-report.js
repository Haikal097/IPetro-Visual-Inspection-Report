// Create Report Form JavaScript

let currentStep = 1;
let defectCount = 1;
let uploadedPhotos = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inspection_date').value = today;
    
    // Setup drag and drop
    setupDragAndDrop();
    
    // Update summary on any input change
    document.getElementById('reportForm').addEventListener('input', updateSummary);
});

// ============================================================================
// STEP NAVIGATION
// ============================================================================

function nextStep() {
    // Validate current step
    if (!validateStep(currentStep)) {
        return;
    }
    
    // Mark current step as completed
    const currentStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    currentStepEl.classList.add('completed');
    
    // Hide current section
    const currentSection = document.querySelector(`.form-section[data-section="${currentStep}"]`);
    currentSection.classList.remove('active');
    
    // Move to next step
    currentStep++;
    
    // Show next section
    const nextSection = document.querySelector(`.form-section[data-section="${currentStep}"]`);
    nextSection.classList.add('active');
    
    // Update step indicator
    const nextStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    nextStepEl.classList.add('active');
    
    // Remove active from previous steps
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        if (stepNum < currentStep) {
            step.classList.remove('active');
        }
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update summary if on final step
    if (currentStep === 4) {
        updateSummary();
    }
}

function prevStep() {
    // Hide current section
    const currentSection = document.querySelector(`.form-section[data-section="${currentStep}"]`);
    currentSection.classList.remove('active');
    
    // Remove active from current step
    const currentStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    currentStepEl.classList.remove('active');
    
    // Move to previous step
    currentStep--;
    
    // Show previous section
    const prevSection = document.querySelector(`.form-section[data-section="${currentStep}"]`);
    prevSection.classList.add('active');
    
    // Update step indicator
    const prevStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    prevStepEl.classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateStep(step) {
    let isValid = true;
    const section = document.querySelector(`.form-section[data-section="${step}"]`);
    
    // Get all required fields in current step
    const requiredFields = section.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#c33';
            
            // Show error message
            if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('error-message')) {
                const errorMsg = document.createElement('small');
                errorMsg.className = 'error-message';
                errorMsg.style.color = '#c33';
                errorMsg.textContent = 'This field is required';
                field.parentNode.insertBefore(errorMsg, field.nextSibling);
            }
        } else {
            field.style.borderColor = '';
            // Remove error message if exists
            const errorMsg = field.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.remove();
            }
        }
    });
    
    if (!isValid) {
        alert('Please fill in all required fields before proceeding.');
    }
    
    return isValid;
}

// ============================================================================
// EQUIPMENT DETAILS
// ============================================================================

function loadEquipmentDetails() {
    const equipmentId = document.getElementById('equipment_id').value;
    
    // Sample equipment data (replace with database query)
    const equipmentData = {
        '1': { tag: 'V-101', pmt: 'PMT-12345', name: 'Pressure Vessel V-101' },
        '2': { tag: 'HE-205', pmt: 'PMT-12346', name: 'Heat Exchanger HE-205' },
        '3': { tag: 'R-301', pmt: 'PMT-12347', name: 'Reactor R-301' },
        '4': { tag: 'S-110', pmt: 'PMT-12348', name: 'Separator S-110' },
        '5': { tag: 'A-402', pmt: 'PMT-12349', name: 'Accumulator A-402' },
        '6': { tag: 'C-201', pmt: 'PMT-12350', name: 'Condenser C-201' }
    };
    
    if (equipmentId && equipmentData[equipmentId]) {
        const data = equipmentData[equipmentId];
        document.getElementById('equipment_tag').value = data.tag;
        document.getElementById('pmt_number').value = data.pmt;
        document.getElementById('summaryEquipment').textContent = data.name;
    } else {
        document.getElementById('equipment_tag').value = '';
        document.getElementById('pmt_number').value = '';
        document.getElementById('summaryEquipment').textContent = '-';
    }
}

// ============================================================================
// PHOTO UPLOAD
// ============================================================================

function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = '#dd1f2e';
            uploadArea.style.background = 'rgba(221, 31, 46, 0.1)';
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });
    });
    
    uploadArea.addEventListener('drop', handleDrop, false);
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    // Convert FileList to Array
    const filesArray = Array.from(files);
    
    filesArray.forEach(file => {
        // Validate file
        if (!file.type.match('image.*')) {
            alert(`${file.name} is not an image file.`);
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB
            alert(`${file.name} is too large. Maximum size is 10MB.`);
            return;
        }
        
        // Add to uploaded photos array
        uploadedPhotos.push(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            addPhotoPreview(file, e.target.result);
        };
        reader.readAsDataURL(file);
    });
    
    updateSummary();
}

function addPhotoPreview(file, dataUrl) {
    const previewGrid = document.getElementById('photoPreview');
    
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-preview-item';
    photoItem.dataset.filename = file.name;
    
    photoItem.innerHTML = `
        <img src="${dataUrl}" alt="${file.name}">
        <button type="button" class="photo-remove" onclick="removePhoto('${file.name}')">×</button>
        <div class="photo-info">
            <div>${file.name}</div>
            <div>${(file.size / 1024).toFixed(1)} KB</div>
        </div>
    `;
    
    previewGrid.appendChild(photoItem);
}

function removePhoto(filename) {
    // Remove from array
    uploadedPhotos = uploadedPhotos.filter(file => file.name !== filename);
    
    // Remove from DOM
    const photoItem = document.querySelector(`.photo-preview-item[data-filename="${filename}"]`);
    if (photoItem) {
        photoItem.remove();
    }
    
    updateSummary();
}

// ============================================================================
// DEFECT MANAGEMENT
// ============================================================================

function addDefect() {
    defectCount++;
    const container = document.getElementById('defectsContainer');
    
    const defectEntry = document.createElement('div');
    defectEntry.className = 'defect-entry';
    defectEntry.dataset.defect = defectCount;
    
    defectEntry.innerHTML = `
        <div class="defect-header">
            <h4>Defect #${defectCount}</h4>
            <button type="button" class="btn-remove" onclick="removeDefect(${defectCount})">✕ Remove</button>
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
    `;
    
    container.appendChild(defectEntry);
    updateSummary();
}

function removeDefect(defectNum) {
    const defectEntry = document.querySelector(`.defect-entry[data-defect="${defectNum}"]`);
    if (defectEntry) {
        defectEntry.remove();
        updateSummary();
    }
}

// ============================================================================
// SUMMARY UPDATE
// ============================================================================

function updateSummary() {
    // Update inspection date
    const inspectionDate = document.getElementById('inspection_date').value;
    document.getElementById('summaryDate').textContent = inspectionDate || '-';
    
    // Update equipment (already updated in loadEquipmentDetails)
    
    // Update photos count
    document.getElementById('summaryPhotos').textContent = uploadedPhotos.length;
    
    // Update defects count
    const defectsCount = document.querySelectorAll('.defect-entry').length;
    document.getElementById('summaryDefects').textContent = defectsCount;
}

// ============================================================================
// FORM SUBMISSION
// ============================================================================

document.getElementById('reportForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate all steps
    for (let i = 1; i <= 4; i++) {
        if (!validateStep(i)) {
            alert(`Please complete step ${i} before submitting.`);
            return;
        }
    }
    
    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    
    // Prepare form data
    const formData = new FormData(this);
    
    // Add photos to form data
    uploadedPhotos.forEach((photo, index) => {
        formData.append(`photos[]`, photo);
    });
    
    try {
        // DEMO MODE: Simulate submission
        await simulateSubmission();
        
        /* PRODUCTION CODE:
        const response = await fetch('save-report.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Report submitted successfully!');
            window.location.href = 'home.php';
        } else {
            alert('Error: ' + result.message);
            resetSubmitButton(submitBtn, btnText, btnLoader);
        }
        */
        
    } catch (error) {
        console.error('Submission error:', error);
        alert('An error occurred while submitting the report.');
        resetSubmitButton(submitBtn, btnText, btnLoader);
    }
});

// Simulate submission (Demo purposes)
async function simulateSubmission() {
    return new Promise((resolve) => {
        setTimeout(() => {
            alert('✓ Report submitted successfully!\n\nReport ID: RPT-2025-007\n\nRedirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'home.php';
            }, 1000);
            resolve();
        }, 2000);
    });
}

function resetSubmitButton(submitBtn, btnText, btnLoader) {
    submitBtn.disabled = false;
    btnText.style.display = 'block';
    btnLoader.style.display = 'none';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Auto-save draft (optional feature)
function autoSaveDraft() {
    const formData = new FormData(document.getElementById('reportForm'));
    const draftData = {};
    
    for (let [key, value] of formData.entries()) {
        draftData[key] = value;
    }
    
    // Save to localStorage
    localStorage.setItem('reportDraft', JSON.stringify(draftData));
    console.log('Draft auto-saved');
}

// Load draft (optional feature)
function loadDraft() {
    const draftData = localStorage.getItem('reportDraft');
    if (draftData) {
        const data = JSON.parse(draftData);
        // Populate form fields with draft data
        Object.keys(data).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
    }
}

// Clear draft
function clearDraft() {
    localStorage.removeItem('reportDraft');
}

// Warn before leaving page if form is dirty
let formIsDirty = false;

document.getElementById('reportForm').addEventListener('input', function() {
    formIsDirty = true;
});

window.addEventListener('beforeunload', function(e) {
    if (formIsDirty) {
        e.preventDefault();
        e.returnValue = '';
        return 'You have unsaved changes. Are you sure you want to leave?';
    }
});

// Mark form as clean on successful submission
document.getElementById('reportForm').addEventListener('submit', function() {
    formIsDirty = false;
});