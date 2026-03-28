document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const homeBtn = document.getElementById('home-btn');
    const dashboard = document.getElementById('dashboard');
    const workspace = document.getElementById('workspace');
    const toolCards = document.querySelectorAll('.tool-card');
    
    const toolTitle = document.getElementById('tool-title');
    const toolDesc = document.getElementById('tool-desc');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    const previewArea = document.getElementById('preview-area');
    const previewContainer = document.getElementById('preview-container');
    const toolSettings = document.getElementById('tool-settings');
    const compressionOptions = document.getElementById('compression-options');
    const processBtn = document.getElementById('process-btn');
    
    const resultArea = document.getElementById('result-area');
    const resultMessage = document.getElementById('result-message');
    const statsDashboard = document.getElementById('stats-dashboard');
    const originalSizeEl = document.getElementById('original-size');
    const compressedSizeEl = document.getElementById('compressed-size');
    const reductionRateEl = document.getElementById('reduction-rate');
    const downloadLinks = document.getElementById('download-links');
    const resetBtn = document.getElementById('reset-btn');

    // State
    let currentTool = '';
    let uploadedFiles = [];
    let compressionLevel = 'recommended'; // Default

    const toolInfo = {
        'compress': { title: '이미지 압축', desc: '이미지 품질을 최대한 유지하면서 파일 용량을 줄입니다.' },
        'resize': { title: '크기 조절', desc: '픽셀 단위로 이미지의 너비와 높이를 조정합니다.' },
        'crop': { title: '이미지 자르기', desc: '원하는 영역만 남기고 이미지를 자릅니다.' },
        'convert-to-jpg': { title: 'JPG 변환', desc: '다양한 이미지 형식을 JPG로 변환합니다.' }
    };

    const navLinks = document.querySelectorAll('.nav-links li');

    // Navigation
    homeBtn.addEventListener('click', showDashboard);
    resetBtn.addEventListener('click', () => {
        uploadedFiles = [];
        showTool(currentTool);
    });

    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.getAttribute('data-tool');
            showTool(tool);
        });
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tool = link.getAttribute('data-nav');
            if (tool) showTool(tool);
        });
    });

    function showDashboard() {
        dashboard.classList.remove('hidden');
        workspace.classList.add('hidden');
        uploadedFiles = [];
    }

    function showTool(tool) {
        currentTool = tool;
        dashboard.classList.add('hidden');
        workspace.classList.remove('hidden');
        
        toolTitle.textContent = toolInfo[tool].title;
        toolDesc.textContent = toolInfo[tool].desc;
        
        dropZone.classList.remove('hidden');
        previewArea.classList.add('hidden');
        resultArea.classList.add('hidden');
        compressionOptions.classList.add('hidden');
        
        toolSettings.innerHTML = '';
        renderToolSettings(tool);
    }

    function renderToolSettings(tool) {
        if (tool === 'resize') {
            toolSettings.innerHTML = `
                <div style="display: flex; gap: 20px; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <label style="font-size: 17px;">너비(px): </label>
                    <input type="number" id="resize-width" value="1200" style="padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); width: 120px; font-size: 17px;">
                </div>
            `;
        }
    }

    // Compression Level Selection
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            compressionLevel = card.getAttribute('data-level');
        });
    });

    // File Handling
    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedFiles.push({
                        file: file,
                        dataUrl: e.target.result,
                        name: file.name,
                        originalSize: file.size
                    });
                    renderPreviews();
                };
                reader.readAsDataURL(file);
            }
        });

        dropZone.classList.add('hidden');
        previewArea.classList.remove('hidden');
        
        if (currentTool === 'compress') {
            compressionOptions.classList.remove('hidden');
        }
    }

    function renderPreviews() {
        previewContainer.innerHTML = '';
        uploadedFiles.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <img src="${item.dataUrl}" alt="preview">
                <div class="file-name" style="margin-top: 10px; font-size: 14px; color: var(--apple-text-secondary);">${item.name}</div>
            `;
            previewContainer.appendChild(div);
        });
    }

    // Processing
    processBtn.addEventListener('click', async () => {
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> 처리 중...';
        
        const results = [];
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        
        for (const item of uploadedFiles) {
            const result = await processImage(item);
            results.push(result);
            totalOriginalSize += item.originalSize;
            totalCompressedSize += result.size;
        }
        
        showResults(results, totalOriginalSize, totalCompressedSize);
        
        processBtn.disabled = false;
        processBtn.innerHTML = '작업 시작하기';
    });

    async function processImage(item) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                
                if (currentTool === 'resize') {
                    const newWidth = parseInt(document.getElementById('resize-width').value) || 1200;
                    const ratio = newWidth / width;
                    width = newWidth;
                    height = height * ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                let mimeType = item.file.type;
                let quality = 0.92;
                
                if (currentTool === 'compress') {
                    if (compressionLevel === 'high') quality = 0.3;
                    else if (compressionLevel === 'recommended') quality = 0.6;
                    else quality = 0.85;
                    
                    // Force JPEG for compression to ensure size reduction works well
                    mimeType = 'image/jpeg';
                } else if (currentTool === 'convert-to-jpg') {
                    mimeType = 'image/jpeg';
                }
                
                const dataUrl = canvas.toDataURL(mimeType, quality);
                
                // Calculate size of dataURL
                const stringLength = dataUrl.split(',')[1].length;
                const sizeInBytes = Math.ceil(stringLength * 0.75);

                resolve({
                    name: `imgcraft-${item.name.split('.')[0]}.${mimeType === 'image/jpeg' ? 'jpg' : 'png'}`,
                    dataUrl: dataUrl,
                    size: sizeInBytes
                });
            };
            img.src = item.dataUrl;
        });
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showResults(results, original, compressed) {
        previewArea.classList.add('hidden');
        resultArea.classList.remove('hidden');
        
        if (currentTool === 'compress') {
            statsDashboard.classList.remove('hidden');
            resultMessage.textContent = '이미지 압축이 완료되었습니다.';
            originalSizeEl.textContent = formatSize(original);
            compressedSizeEl.textContent = formatSize(compressed);
            const reduction = ((original - compressed) / original * 100).toFixed(0);
            reductionRateEl.textContent = `${reduction}%`;
        } else {
            statsDashboard.classList.add('hidden');
            resultMessage.textContent = '작업이 성공적으로 완료되었습니다.';
        }
        
        downloadLinks.innerHTML = '';
        results.forEach(result => {
            const a = document.createElement('a');
            a.href = result.dataUrl;
            a.download = result.name;
            a.className = 'download-btn';
            a.innerHTML = `<i class="fas fa-download"></i> ${result.name}`;
            downloadLinks.appendChild(a);
        });
    }
});
