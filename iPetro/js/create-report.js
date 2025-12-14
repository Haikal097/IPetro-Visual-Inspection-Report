// Photo-First Inspection Report System

let uploadedPhotos = [];
let currentPhotoIndex = 0;
let photoData = []; // Stores details for each photo

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
    updateProgressIndicator();
});

// ============================================================================
// STEP 1: PHOTO UPLOAD
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
    const filesArray = Array.from(files);
    
    filesArray.forEach(file => {
        if (!file.type.match('image.*')) {
            alert(`${file.name} is not an image file.`);
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            alert(`${file.name} is too large. Maximum size is 10MB.`);
            return;
        }
        
        uploadedPhotos.push(file);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            addPhotoToGallery(file, e.target.result, uploadedPhotos.length - 1);
            updatePhotoCount();
        };
        reader.readAsDataURL(file);
    });
}

function addPhotoToGallery(file, dataUrl, index) {
    const gallery = document.getElementById('photoGallery');
    
    const photoCard = document.createElement('div');
    photoCard.className = 'photo-card';
    photoCard.dataset.index = index;
    
    photoCard.innerHTML = `
        <img src="${dataUrl}" alt="${file.name}">
        <div class="photo-card-info">
            <p class="photo-card-name">${file.name}</p>
            <p class="photo-card-size">${(file.size / 1024).toFixed(1)} KB</p>
            <span class="photo-status" id="status-${index}">⏳ Pending</span>
        </div>
        <button type="button" class="photo-card-remove" onclick="removePhoto(${index})">×</button>
    `;
    
    gallery.appendChild(photoCard);
}

function removePhoto(index) {
    uploadedPhotos.splice(index, 1);
    photoData.splice(index, 1);
    
    // Rebuild gallery
    const gallery = document.getElementById('photoGallery');
    gallery.innerHTML = '';
    
    uploadedPhotos.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            addPhotoToGallery(file, e.target.result, i);
            if (photoData[i]) {
                document.getElementById(`status-${i}`).textContent = '✓ Completed';
                document.getElementById(`status-${i}`).style.color = '#27ae60';
            }
        };
        reader.readAsDataURL(file);
    });
    
    updatePhotoCount();
}

function updatePhotoCount() {
    const count = uploadedPhotos.length;
    document.getElementById('photoCount').textContent = `${count} photo${count !== 1 ? 's' : ''} uploaded`;
    document.getElementById('proceedBtn').textContent = `Next: Fill Photo Details (${count} photo${count !== 1 ? 's' : ''}) →`;
    document.getElementById('proceedBtn').disabled = count === 0;
    
    if (count > 0) {
        document.getElementById('detailsProgress').classList.add('active');
    }
}

function proceedToDetails() {
    if (uploadedPhotos.length === 0) {
        alert('Please upload at least one photo first.');
        return;
    }
    
    // Initialize photoData array
    if (photoData.length === 0) {
        photoData = uploadedPhotos.map(() => ({}));
    }
    
    document.getElementById('uploadSection').classList.remove('active');
    document.getElementById('detailsSection').classList.add('active');
    
    currentPhotoIndex = 0;
    loadPhotoDetails(0);
    updatePhotoNavigation();
    updateProgressIndicator();
}

// ============================================================================
// STEP 2: FILL PHOTO DETAILS
// ============================================================================

function loadPhotoDetails(index) {
    const file = uploadedPhotos[index];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        document.getElementById('currentPhotoImg').src = e.target.result;
        document.getElementById('currentPhotoName').textContent = file.name;
    };
    reader.readAsDataURL(file);
    
    // Load saved data if exists
    if (photoData[index]) {
        const data = photoData[index];
        document.querySelectorAll('.photo-field').forEach(field => {
            const fieldName = field.dataset.field;
            if (data[fieldName]) {
                if (field.type === 'checkbox') {
                    field.checked = data[fieldName];
                } else {
                    field.value = data[fieldName];
                }
                
                // Trigger change events for "other" fields
                if (field.tagName === 'SELECT') {
                    field.dispatchEvent(new Event('change'));
                }
            }
        });
        
        // Handle defect toggle
        if (data.defect_found === 'yes') {
            document.getElementById('defectFields').style.display = 'block';
        }
    } else {
        // Clear form for new photo
        document.querySelectorAll('.photo-field').forEach(field => {
            if (field.type === 'checkbox') {
                field.checked = false;
            } else {
                field.value = '';
            }
        });
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.querySelector('[data-field="inspection_date"]').value = today;
        document.querySelector('[data-field="defect_found"]').value = 'no';
        document.getElementById('defectFields').style.display = 'none';
    }
}

function saveCurrentPhoto() {
    const data = {};
    let isValid = true;
    
    // Collect all field values
    document.querySelectorAll('.photo-field').forEach(field => {
        const fieldName = field.dataset.field;
        
        if (field.type === 'checkbox') {
            data[fieldName] = field.checked;
        } else {
            data[fieldName] = field.value;
        }
        
        // Validate required fields
        if (field.required && !field.value) {
            isValid = false;
            field.style.borderColor = '#c33';
        } else {
            field.style.borderColor = '';
        }
    });
    
    if (!isValid) {
        alert('Please fill in all required fields.');
        return false;
    }
    
    // Handle "other" fields
    if (data.equipment_type === 'other' && data.equipment_type_other) {
        data.equipment_type = data.equipment_type_other;
    }
    if (data.equipment_tag === 'other' && data.equipment_tag_other) {
        data.equipment_tag = data.equipment_tag_other;
    }
    if (data.pmt_number === 'other' && data.pmt_number_other) {
        data.pmt_number = data.pmt_number_other;
    }
    if (data.equipment_location === 'other' && data.equipment_location_other) {
        data.equipment_location = data.equipment_location_other;
    }
    if (data.defect_location === 'other' && data.defect_location_other) {
        data.defect_location = data.defect_location_other;
    }
    if (data.general_findings === 'other' && data.general_findings_other) {
        data.general_findings = data.general_findings_other;
    }
    if (data.recommendations === 'other' && data.recommendations_other) {
        data.recommendations = data.recommendations_other;
    }
    
    photoData[currentPhotoIndex] = data;
    
    // Update status in gallery
    const statusEl = document.getElementById(`status-${currentPhotoIndex}`);
    if (statusEl) {
        statusEl.textContent = '✓ Completed';
        statusEl.style.color = '#27ae60';
    }
    
    updateProgressIndicator();
    showToast('Photo details saved successfully!', 'success');
    return true;
}

function saveAndNext() {
    if (saveCurrentPhoto()) {
        if (currentPhotoIndex < uploadedPhotos.length - 1) {
            nextPhoto();
        } else {
            // All photos completed
            proceedToReview();
        }
    }
}

function nextPhoto() {
    if (currentPhotoIndex < uploadedPhotos.length - 1) {
        currentPhotoIndex++;
        loadPhotoDetails(currentPhotoIndex);
        updatePhotoNavigation();
    }
}

function previousPhoto() {
    if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
        loadPhotoDetails(currentPhotoIndex);
        updatePhotoNavigation();
    }
}

function updatePhotoNavigation() {
    const total = uploadedPhotos.length;
    document.getElementById('photoCounter').textContent = `Photo ${currentPhotoIndex + 1} of ${total}`;
    
    document.getElementById('prevPhotoBtn').disabled = currentPhotoIndex === 0;
    document.getElementById('nextPhotoBtn').disabled = currentPhotoIndex >= total - 1;
    
    // Update button text
    if (currentPhotoIndex === total - 1) {
        document.getElementById('saveNextBtn').textContent = 'Save & Review Report →';
    } else {
        document.getElementById('saveNextBtn').textContent = 'Save & Next Photo →';
    }
}

// ============================================================================
// HANDLE "OTHER" SELECTIONS
// ============================================================================

function handleEquipmentTypeChange(select) {
    const otherGroup = document.getElementById('otherEquipmentGroup');
    otherGroup.style.display = select.value === 'other' ? 'block' : 'none';
}

function handleTagChange(select) {
    const otherGroup = document.getElementById('otherTagGroup');
    otherGroup.style.display = select.value === 'other' ? 'block' : 'none';
}

function handlePMTChange(select) {
    const otherGroup = document.getElementById('otherPMTGroup');
    otherGroup.style.display = select.value === 'other' ? 'block' : 'none';
}

function handleLocationChange(select) {
    const otherGroup = document.getElementById('otherLocationGroup');
    otherGroup.style.display = select.value === 'other' ? 'block' : 'none';
}

function handleDefectLocationChange(select) {
    const otherGroup = document.getElementById('otherDefectLocationGroup');
    otherGroup.style.display = select.value === 'other' ? 'block' : 'none';
}

function handleFindingsChange(select) {
    const otherGroup = document.getElementById('otherFindingsGroup');
    otherGroup.style.display = select.value === 'other' ? 'block' : 'none';
}

function handleRecommendationsChange(select) {
    const otherGroup = document.getElementById('otherRecommendationsGroup');
    otherGroup.style.display = select.value === 'other' ? 'block' : 'none';
}

function toggleDefectFields(select) {
    const defectFields = document.getElementById('defectFields');
    defectFields.style.display = select.value === 'yes' ? 'block' : 'none';
}

// ============================================================================
// STEP 3: REVIEW & SUBMIT
// ============================================================================

function proceedToReview() {
    // Check if all photos have details
    const completedCount = photoData.filter(d => Object.keys(d).length > 0).length;
    
    if (completedCount < uploadedPhotos.length) {
        const proceed = confirm(`Only ${completedCount} of ${uploadedPhotos.length} photos have details filled. Do you want to continue to review?`);
        if (!proceed) return;
    }
    
    document.getElementById('detailsSection').classList.remove('active');
    document.getElementById('reviewSection').classList.add('active');
    document.getElementById('submitProgress').classList.add('active');
    
    populateReview();
    updateProgressIndicator();
}

function populateReview() {
    const completedCount = photoData.filter(d => Object.keys(d).length > 0).length;
    
    document.getElementById('reviewPhotoCount').textContent = uploadedPhotos.length;
    document.getElementById('reviewCompletedCount').textContent = completedCount;
    document.getElementById('reviewDate').textContent = new Date().toLocaleDateString();
    
    const reviewGrid = document.getElementById('reviewGrid');
    reviewGrid.innerHTML = '';
    
    uploadedPhotos.forEach((file, index) => {
        const data = photoData[index] || {};
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const card = document.createElement('div');
            card.className = 'review-photo-card';
            
            card.innerHTML = `
                <div class="review-photo-header">
                    <strong>Photo ${index + 1}</strong>
                    <button type="button" class="btn-edit-small" onclick="editPhoto(${index})">✏️ Edit</button>
                </div>
                <img src="${e.target.result}" alt="Photo ${index + 1}">
                <div class="review-photo-details">
                    <p><strong>Equipment:</strong> ${data.equipment_type || 'N/A'} (${data.equipment_tag || 'N/A'})</p>
                    <p><strong>Location:</strong> ${data.equipment_location || 'N/A'}</p>
                    <p><strong>Inspection:</strong> ${data.inspection_type || 'N/A'}</p>
                    <p><strong>Defect:</strong> ${data.defect_found === 'yes' ? `Yes - ${data.defect_type || 'N/A'}` : 'No'}</p>
                    ${data.defect_found === 'yes' ? `<p><strong>Severity:</strong> ${data.defect_severity || 'N/A'}</p>` : ''}
                </div>
            `;
            
            reviewGrid.appendChild(card);
        };
        reader.readAsDataURL(file);
    });
}

function editPhoto(index) {
    currentPhotoIndex = index;
    document.getElementById('reviewSection').classList.remove('active');
    document.getElementById('detailsSection').classList.add('active');
    loadPhotoDetails(index);
    updatePhotoNavigation();
}

// ============================================================================
// SUBMIT REPORT
// ============================================================================

async function submitReport() {
    const completedCount = photoData.filter(d => Object.keys(d).length > 0).length;
    
    if (completedCount < uploadedPhotos.length) {
        alert(`Warning: Only ${completedCount} of ${uploadedPhotos.length} photos have complete details.`);
    }
    
    const submitBtn = document.getElementById('finalSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    
    try {
        // Simulate submission
        await simulateSubmission();
        
        /* PRODUCTION CODE:
        const formData = new FormData();
        
        // Add each photo with its data
        uploadedPhotos.forEach((photo, index) => {
            formData.append(`photos[]`, photo);
            formData.append(`photo_data[]`, JSON.stringify(photoData[index] || {}));
        });
        
        const response = await fetch('save-report-v2.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Report submitted successfully!', 'success');
            setTimeout(() => window.location.href = 'home.php', 2000);
        } else {
            throw new Error(result.message);
        }
        */
        
    } catch (error) {
        console.error('Submission error:', error);
        showToast('Error submitting report', 'error');
        submitBtn.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
}

async function simulateSubmission() {
    return new Promise((resolve) => {
        setTimeout(() => {
            alert(`✓ Report submitted successfully!\n\nReport ID: RPT-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}\nPhotos: ${uploadedPhotos.length}\nCompleted: ${photoData.filter(d => Object.keys(d).length > 0).length}\n\nRedirecting to dashboard...`);
            setTimeout(() => window.location.href = 'home.php', 1000);
            resolve();
        }, 2000);
    });
}

// ============================================================================
// NAVIGATION
// ============================================================================

function backToUpload() {
    document.getElementById('detailsSection').classList.remove('active');
    document.getElementById('uploadSection').classList.add('active');
    updateProgressIndicator();
}

function backToDetails() {
    document.getElementById('reviewSection').classList.remove('active');
    document.getElementById('detailsSection').classList.add('active');
    updateProgressIndicator();
}

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

function updateProgressIndicator() {
    const completedCount = photoData.filter(d => Object.keys(d).length > 0).length;
    const totalCount = uploadedPhotos.length;
    
    document.getElementById('detailsCount').textContent = `${completedCount} of ${totalCount} completed`;
    
    // Update progress item states
    if (completedCount === totalCount && totalCount > 0) {
        document.getElementById('submitProgress').classList.add('active');
    }
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'info') {
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="this.parentElement.remove()">×</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}