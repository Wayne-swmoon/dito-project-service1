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
    const processBtn = document.getElementById('process-btn');
    
    const resultArea = document.getElementById('result-area');
    const downloadLinks = document.getElementById('download-links');
    const resetBtn = document.getElementById('reset-btn');

    // State
    let currentTool = '';
    let uploadedFiles = [];

    const toolInfo = {
        'compress': { title: '이미지 압축', desc: '이미지 품질을 최대한 유지하면서 파일 용량을 줄입니다.' },
        'resize': { title: '이미지 크기 조절', desc: '픽셀 단위로 이미지의 너비와 높이를 조정합니다.' },
        'crop': { title: '이미지 자르기', desc: '원하는 영역만 남기고 이미지를 자릅니다.' },
        'convert-to-jpg': { title: 'JPG로 변환', desc: '다양한 이미지 형식을 JPG로 변환합니다.' },
        'convert-from-jpg': { title: 'JPG에서 변환', desc: 'JPG 이미지를 PNG 또는 GIF로 변환합니다.' },
        'rotate': { title: '이미지 회전', desc: '이미지를 원하는 각도로 회전시킵니다.' },
        'watermark': { title: '워터마크 이미지', desc: '이미지에 텍스트나 로고 워터마크를 추가합니다.' },
        'meme': { title: '밈 만들기', desc: '자신만의 재미있는 밈을 만듭니다.' }
    };

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
        
        // Reset settings
        toolSettings.innerHTML = '';
        renderToolSettings(tool);
    }

    function renderToolSettings(tool) {
        if (tool === 'compress') {
            toolSettings.innerHTML = '<p>압축 수준: <strong>보통 (권장)</strong></p>';
        } else if (tool === 'resize') {
            toolSettings.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label>너비(px): </label>
                    <input type="number" id="resize-width" value="800" style="padding: 5px; width: 80px;">
                </div>
            `;
        } else if (tool === 'rotate') {
            toolSettings.innerHTML = '<p>시계 방향으로 <strong>90도</strong> 회전합니다.</p>';
        } else if (tool === 'convert-to-jpg') {
            toolSettings.innerHTML = '<p>선택한 모든 이미지를 <strong>JPG</strong>로 변환합니다.</p>';
        }
    }

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
                        name: file.name
                    });
                    renderPreviews();
                };
                reader.readAsDataURL(file);
            }
        });

        dropZone.classList.add('hidden');
        previewArea.classList.remove('hidden');
    }

    function renderPreviews() {
        previewContainer.innerHTML = '';
        uploadedFiles.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <img src="${item.dataUrl}" alt="preview">
                <div class="file-name">${item.name}</div>
            `;
            previewContainer.appendChild(div);
        });
    }

    // Processing
    processBtn.addEventListener('click', async () => {
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리 중...';
        
        const results = [];
        
        for (const item of uploadedFiles) {
            const result = await processImage(item);
            results.push(result);
        }
        
        showResults(results);
        
        processBtn.disabled = false;
        processBtn.innerHTML = '이미지 처리하기 <i class="fas fa-arrow-right"></i>';
    });

    async function processImage(item) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                
                // Tool specific logic
                if (currentTool === 'resize') {
                    const newWidth = parseInt(document.getElementById('resize-width').value) || 800;
                    const ratio = newWidth / width;
                    width = newWidth;
                    height = height * ratio;
                }
                
                if (currentTool === 'rotate') {
                    canvas.width = height;
                    canvas.height = width;
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(90 * Math.PI / 180);
                    ctx.drawImage(img, -width / 2, -height / 2, width, height);
                } else {
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                }
                
                let mimeType = item.file.type;
                let quality = 0.92;
                let extension = item.name.split('.').pop();
                
                if (currentTool === 'compress') {
                    quality = 0.6;
                } else if (currentTool === 'convert-to-jpg') {
                    mimeType = 'image/jpeg';
                    extension = 'jpg';
                }
                
                const dataUrl = canvas.toDataURL(mimeType, quality);
                resolve({
                    name: `iloveimg-clone-${item.name.split('.')[0]}.${extension}`,
                    dataUrl: dataUrl
                });
            };
            img.src = item.dataUrl;
        });
    }

    function showResults(results) {
        previewArea.classList.add('hidden');
        resultArea.classList.remove('hidden');
        
        downloadLinks.innerHTML = '';
        results.forEach(result => {
            const a = document.createElement('a');
            a.href = result.dataUrl;
            a.download = result.name;
            a.className = 'download-btn';
            a.innerHTML = `<i class="fas fa-download"></i> ${result.name} 다운로드`;
            downloadLinks.appendChild(a);
        });
    }
});
