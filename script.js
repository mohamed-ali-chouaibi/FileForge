const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const settingsPanel = document.getElementById('settingsPanel');
const fileBadge = document.getElementById('fileBadge');
const formatDropdown = document.getElementById('formatDropdown');
const convertBtn = document.getElementById('convertBtn');
const converterCard = document.getElementById('converterCard');
const successCard = document.getElementById('successCard');
const conversionSummary = document.getElementById('conversionSummary');
const previewBox = document.getElementById('previewBox');
const downloadBtn = document.getElementById('downloadBtn');
const convertAnotherBtn = document.getElementById('convertAnotherBtn');
const startOverBtn = document.getElementById('startOverBtn');

let selectedFile = null;
let convertedBlob = null;
let convertedFormat = null;
let convertedFileName = null;

uploadZone.addEventListener('click', () => {
    fileInput.click();
});

browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '#3B82F6';
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = '#CBD5E1';
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    selectedFile = file;
    
    const fileIconSVG = `
        <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    `;
    
    uploadZone.classList.add('file-selected');
    uploadZone.innerHTML = `
        ${fileIconSVG}
        <p class="upload-text">${file.name}</p>
        <p class="upload-link">${formatFileSize(file.size)}</p>
    `;
    
    settingsPanel.classList.add('active');
    fileBadge.innerHTML = `
        <svg class="file-badge-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        ${file.name}
    `;
    
    updateFormatOptions(file);
    
    if (formatDropdown.value) {
        convertBtn.disabled = false;
    }
}

function updateFormatOptions(file) {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    formatDropdown.innerHTML = '<option value="">Select format...</option>';
    
    if (fileType.startsWith('image/')) {
        addFormatOption('png', 'PNG Image', getImageIconSVG());
        addFormatOption('jpg', 'JPG Image', getImageIconSVG());
        addFormatOption('webp', 'WEBP Image', getImageIconSVG());
        addFormatOption('pdf', 'PDF Document', getDocIconSVG());
    }
    else if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
        addFormatOption('pdf', 'PDF Document', getDocIconSVG());
    }
    else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        addFormatOption('txt', 'Text File', getTextIconSVG());
    }
    else {
        addFormatOption('txt', 'Text File', getTextIconSVG());
        addFormatOption('pdf', 'PDF Document', getDocIconSVG());
    }
}

function addFormatOption(value, label, iconSVG) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    formatDropdown.appendChild(option);
}

formatDropdown.addEventListener('change', () => {
    if (selectedFile && formatDropdown.value) {
        convertBtn.disabled = false;
    }
});

convertBtn.addEventListener('click', async () => {
    if (!selectedFile || !formatDropdown.value) return;
    
    convertedFormat = formatDropdown.value;
    
    convertBtn.innerHTML = `
        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Converting your file securely...
    `;
    convertBtn.classList.add('loading');
    convertBtn.disabled = true;
    
    try {
        await performConversion();
        showSuccessScreen();
    } catch (error) {
        alert('Conversion failed: ' + error.message);
        convertBtn.textContent = 'Convert File';
        convertBtn.classList.remove('loading');
        convertBtn.disabled = false;
    }
});

async function performConversion() {
    const sourceType = selectedFile.type;
    const sourceName = selectedFile.name.toLowerCase();
    
    if (sourceType.startsWith('image/')) {
        if (convertedFormat === 'pdf') {
            await convertImageToPDF();
        } else if (['png', 'jpg', 'webp'].includes(convertedFormat)) {
            await convertImageToImage();
        }
    }
    else if (sourceType.startsWith('text/') || sourceName.endsWith('.txt')) {
        if (convertedFormat === 'pdf') {
            await convertTextToPDF();
        }
    }
    else if (sourceType === 'application/pdf' || sourceName.endsWith('.pdf')) {
        if (convertedFormat === 'txt') {
            await convertPDFToText();
        }
    }
    else {
        convertedBlob = selectedFile;
    }
    
    convertedFileName = selectedFile.name.replace(/\.[^/.]+$/, '') + '.' + convertedFormat;
}

async function convertImageToImage() {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const mimeType = convertedFormat === 'png' ? 'image/png' : 
                                convertedFormat === 'jpg' ? 'image/jpeg' : 'image/webp';
                const quality = convertedFormat === 'jpg' ? 0.9 : undefined;
                
                canvas.toBlob((blob) => {
                    convertedBlob = blob;
                    resolve();
                }, mimeType, quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
    });
}

async function convertImageToPDF() {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const { jsPDF } = window.jspdf;
                
                const imgWidth = img.width;
                const imgHeight = img.height;
                const ratio = imgWidth / imgHeight;
                
                let pdfWidth = 210;
                let pdfHeight = pdfWidth / ratio;
                
                if (pdfHeight > 297) {
                    pdfHeight = 297;
                    pdfWidth = pdfHeight * ratio;
                }
                
                const pdf = new jsPDF({
                    orientation: ratio > 1 ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                pdf.addImage(e.target.result, 'JPEG', 10, 10, pdfWidth - 20, pdfHeight - 20);
                convertedBlob = pdf.output('blob');
                resolve();
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
    });
}

async function convertTextToPDF() {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            const text = e.target.result;
            const lines = pdf.splitTextToSize(text, 180);
            
            pdf.setFontSize(12);
            pdf.text(lines, 15, 15);
            
            convertedBlob = pdf.output('blob');
            resolve();
        };
        reader.onerror = reject;
        reader.readAsText(selectedFile);
    });
}

async function convertPDFToText() {
    const text = `PDF File: ${selectedFile.name}\nSize: ${formatFileSize(selectedFile.size)}\n\nNote: Full PDF text extraction requires additional libraries.\nThis is a demo conversion.`;
    convertedBlob = new Blob([text], { type: 'text/plain' });
}

function showSuccessScreen() {
    converterCard.style.display = 'none';
    successCard.classList.remove('hidden');
    
    const sourceExt = selectedFile.name.split('.').pop().toUpperCase();
    const targetExt = convertedFormat.toUpperCase();
    conversionSummary.innerHTML = `
        <p><strong>Converted:</strong> ${selectedFile.name}</p>
        <p><strong>From:</strong> ${sourceExt} <strong>To:</strong> ${targetExt}</p>
        <p><strong>Size:</strong> ${formatFileSize(convertedBlob.size)}</p>
    `;
    
    updatePreview();
}

function updatePreview() {
    if (convertedFormat === 'png' || convertedFormat === 'jpg' || convertedFormat === 'webp') {
        const url = URL.createObjectURL(convertedBlob);
        previewBox.innerHTML = `<img src="${url}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
    } else if (convertedFormat === 'pdf') {
        previewBox.innerHTML = `
            <svg class="preview-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        `;
    } else {
        previewBox.innerHTML = `
            <svg class="preview-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        `;
    }
}

downloadBtn.addEventListener('click', () => {
    if (!convertedBlob) return;
    
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

convertAnotherBtn.addEventListener('click', () => {
    resetApp();
});

startOverBtn.addEventListener('click', () => {
    successCard.classList.add('hidden');
    converterCard.style.display = 'block';
    
    convertBtn.textContent = 'Convert File';
    convertBtn.classList.remove('loading');
    convertBtn.disabled = false;
    formatDropdown.value = '';
    convertedBlob = null;
});

function resetApp() {
    selectedFile = null;
    convertedFormat = null;
    convertedBlob = null;
    convertedFileName = null;
    
    successCard.classList.add('hidden');
    converterCard.style.display = 'block';
    
    uploadZone.classList.remove('file-selected');
    uploadZone.innerHTML = `
        <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="upload-text">Drag & drop your file here</p>
        <p class="upload-link">or <span id="browseBtn">click to browse</span></p>
    `;
    
    document.getElementById('browseBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    settingsPanel.classList.remove('active');
    
    fileInput.value = '';
    formatDropdown.innerHTML = '<option value="">Select format...</option>';
    convertBtn.disabled = true;
    convertBtn.textContent = 'Convert File';
    convertBtn.classList.remove('loading');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getImageIconSVG() {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
}

function getDocIconSVG() {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';
}

function getTextIconSVG() {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
}
