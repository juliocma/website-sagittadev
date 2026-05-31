const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let animationFrame = null;
let startTime;
let isRecording = false;

let exportOriginalWidth = 1920;
let exportOriginalHeight = 1080;

const inputIds = [
    'tamanho', 'textoPersonalizado', 'corFill', 'corBorder', 'corTexto',
    'tamanhoSeta', 'espessuraLinha', 'borderWidth', 'velocidade',
    'easing', 'origem', 'angulo', 'textPos', 'zoom', 'animTexto', 'tipoLinha',
    'arredondamento', 'tamanhoTraco', 'espacoTraco', 'textAcimaAbaixo', 'inverterTexto',
    'mostrarTexto', 'mostrarSetas', 'animacaoInicial', 'tamanhoFonte', 'tipoFundo', 'usarFundo',
    'distanciaTexto', 'rotacaoTexto', 'canvasWidth', 'canvasHeight', 'tipoExportacao', 'qualidadeExportacao'
];

const exportButton = document.getElementsByClassName("btn-export")[0]

function updateCanvasSize() {
    if (isRecording) return;
    const w = parseInt(document.getElementById('canvasWidth').value) || 1920;
    const h = parseInt(document.getElementById('canvasHeight').value) || 1080;
    canvas.width = w;
    canvas.height = h;
    exportOriginalWidth = w;
    exportOriginalHeight = h;
    if (animationFrame === null) drawFrame(1);
}

document.getElementById('canvasWidth').addEventListener('input', () => { saveConfig(); updateCanvasSize(); });
document.getElementById('canvasHeight').addEventListener('input', () => { saveConfig(); updateCanvasSize(); });

function syncInputs(rangeId, numberId) {
    const range = document.getElementById(rangeId);
    const num = document.getElementById(numberId);
    if (range && num) {
        range.addEventListener('input', () => {
            num.value = range.value;
            if (!isRecording && animationFrame === null) drawFrame(1);
            saveConfig();
        });
        num.addEventListener('input', () => {
            range.value = num.value;
            if (!isRecording && animationFrame === null) drawFrame(1);
            saveConfig();
        });
    }
}

function syncColors(colorId, hexId) {
    const col = document.getElementById(colorId);
    const hex = document.getElementById(hexId);
    if (col && hex) {
        col.addEventListener('input', () => {
            hex.value = col.value.toUpperCase();
            if (!isRecording && animationFrame === null) drawFrame(1);
            saveConfig();
        });
        hex.addEventListener('input', () => {
            if (/^#[0-9A-F]{6}$/i.test(hex.value)) {
                col.value = hex.value;
                if (!isRecording && animationFrame === null) drawFrame(1);
                saveConfig();
            }
        });
    }
}

['tamanhoFonte', 'rotacaoTexto', 'tamanhoTraco', 'espacoTraco', 'arredondamento',
    'tamanhoSeta', 'espessuraLinha', 'borderWidth', 'velocidade', 'angulo', 'zoom', 'distanciaTexto']
    .forEach(id => syncInputs(id, id + 'Num'));

['corFill', 'corBorder', 'corTexto', 'corFundo'].forEach(id => syncColors(id, id + 'Hex'));

document.getElementById('tipoLinha').addEventListener('change', function () {
    const painel = document.getElementById('controlesPontilhado');
    if (painel) painel.style.display = this.value === 'pontilhada' ? 'flex' : 'none';
    if (!isRecording && animationFrame === null) drawFrame(1);
    saveConfig();
});

document.querySelectorAll('.controls-scroll input[type="checkbox"], .controls-scroll select, #tamanho, #textoPersonalizado, #tipoExportacao, #qualidadeExportacao').forEach(el => {
    el.addEventListener('input', () => {
        if (!isRecording && animationFrame === null) drawFrame(1);
        saveConfig();
    });
});

const easings = {
    linear: t => t,
    easeOut: t => 1 - Math.pow(1 - t, 3),
    easeInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
};

function getPhaseProgress(progress, start, end) {
    if (progress < start) return 0;
    if (progress > end) return 1;
    return (progress - start) / (end - start);
}

function drawRoundedPolygon(points, r) {
    if (points.length < 3) return;
    ctx.beginPath();
    const pLast = points[points.length - 1];
    const p0 = points[0];
    ctx.moveTo((pLast.x + p0.x) / 2, (pLast.y + p0.y) / 2);

    for (let i = 0; i < points.length; i++) {
        let p1 = points[i];
        let p2 = points[(i + 1) % points.length];

        if (r <= 0) {
            ctx.lineTo(p1.x, p1.y);
        } else {
            ctx.arcTo(p1.x, p1.y, p2.x, p2.y, r);
        }
    }
    ctx.closePath();
}

function drawFrame(progress) {
    const usarFundo = document.getElementById('usarFundo').checked;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (usarFundo) {
        ctx.fillStyle = document.getElementById('corFundo').value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const blocks = Math.floor(parseFloat(document.getElementById('tamanho').value)) || 1;
    const distance = blocks * 16;
    const textCompleto = blocks + (document.getElementById('textoPersonalizado') ? document.getElementById('textoPersonalizado').value : "");

    const fill = document.getElementById('corFill').value;
    const stroke = document.getElementById('corBorder').value;
    const textColor = document.getElementById('corTexto').value;

    const baseArrowSize = parseFloat(document.getElementById('tamanhoSeta').value);
    const lineWidthBody = parseFloat(document.getElementById('espessuraLinha').value);
    const bWidth = parseFloat(document.getElementById('borderWidth').value);

    const origin = document.getElementById('origem').value;
    const angle = parseInt(document.getElementById('angulo').value);
    const textPos = document.getElementById('textPos').value;
    const zoom = parseFloat(document.getElementById('zoom').value);
    const easingType = document.getElementById('easing').value;
    const animTexto = document.getElementById('animTexto').value;
    const tipoLinha = document.getElementById('tipoLinha').value;

    const radius = parseFloat(document.getElementById('arredondamento').value);
    const dashLen = parseFloat(document.getElementById('tamanhoTraco').value);
    const dashGap = parseFloat(document.getElementById('espacoTraco').value);

    const textoAbaixo = document.getElementById('textoAbaixo').checked;
    const rotacaoTexto = parseFloat(document.getElementById('rotacaoTexto').value) || 0;
    const distanciaTexto = parseFloat(document.getElementById('distanciaTexto').value) || 0;

    const mostrarTexto = document.getElementById('mostrarTexto').checked;
    const mostrarSetas = document.getElementById('mostrarSetas').checked;
    const animacaoInicial = document.getElementById('animacaoInicial').checked;
    const tamanhoFonte = parseFloat(document.getElementById('tamanhoFonte').value);

    let animProgress = progress;
    if (!animacaoInicial) {
        animProgress = 0.35 + (progress * 0.65);
    }

    let phase1 = getPhaseProgress(animProgress, 0.0, 0.15);
    let phase2 = getPhaseProgress(animProgress, 0.15, 0.35);
    let phase3 = getPhaseProgress(animProgress, 0.35, 1.0);

    phase1 = easings.easeOut(phase1);
    phase2 = easings.easeInOut(phase2);
    phase3 = easings[easingType](phase3);

    const currentScale = animacaoInicial ? phase1 : 1;
    const currentLength = phase3 * distance;

    const scaledSize = baseArrowSize * currentScale;
    const baseLen = (scaledSize * Math.SQRT2) / 2;
    const halfLine = lineWidthBody / 2;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);

    const angleRad = angle * Math.PI / 180;
    ctx.rotate(angleRad);

    let leftX = 0, rightX = 0;
    if (origin === 'centro') {
        leftX = -currentLength / 2; rightX = currentLength / 2;
    } else if (origin === 'esquerda') {
        leftX = 0; rightX = currentLength;
    } else if (origin === 'direita') {
        leftX = -currentLength; rightX = 0;
    }

    if (phase3 === 0) {
        let safeRadius = Math.min(radius, scaledSize / 3);
        ctx.lineJoin = safeRadius > 0 ? 'round' : 'miter';
        ctx.lineCap = 'butt';
        if (safeRadius > 0) ctx.miterLimit = 1;

        ctx.save();
        ctx.translate(0, 0);

        const startRot = -angleRad;
        const endRot = Math.PI / 4;
        const currentRot = startRot + (endRot - startRot) * phase2;

        if (mostrarSetas) {
            ctx.rotate(currentRot);
            const halfS = scaledSize / 2;
            const pts = [
                { x: -halfS, y: -halfS }, { x: halfS, y: -halfS },
                { x: halfS, y: halfS }, { x: -halfS, y: halfS }
            ];

            drawRoundedPolygon(pts, safeRadius);
            ctx.fillStyle = fill;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = bWidth;
            if (bWidth > 0) ctx.stroke();
            ctx.fill();
        }
        ctx.restore();

    } else {
        if (tipoLinha === 'pontilhada') {

            const tailLen = dashLen / 2;
            const offsetSetas = mostrarSetas ? tailLen : 0;
            let safeRadius = Math.min(radius, halfLine * 1.5);

            const finalDistance = blocks * 16;
            const finalLeftX = origin === 'centro' ? -finalDistance / 2 : (origin === 'esquerda' ? 0 : -finalDistance);
            const finalRightX = origin === 'centro' ? finalDistance / 2 : (origin === 'esquerda' ? finalDistance : 0);

            const L = finalLeftX + offsetSetas;
            const R = finalRightX - offsetSetas;
            const W = R - L;

            let actualGap = dashGap;
            let actualDashLen = dashLen;
            let N = 0;

            if (W > 0) {
                N = Math.round((W - dashGap) / (dashLen + dashGap));
                if (N < 1) N = 1;
                actualGap = (W - N * dashLen) / (N + 1);
                if (actualGap < 0) {
                    N = Math.max(1, N - 1);
                    actualGap = (W - N * dashLen) / (N + 1);
                }
            }

            ctx.fillStyle = fill;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = bWidth;

            if (mostrarSetas) {
                const currentTailLen = Math.min(tailLen, Math.abs(rightX - leftX) / 2);
                safeRadius = Math.min(safeRadius, scaledSize / 3, currentTailLen > 0 ? currentTailLen : 999);

                ctx.save();
                ctx.beginPath();

                let clipLeftOffset = currentTailLen * 0.5;
                let clipRightOffset = currentTailLen * 0.5;

                const clipLeft = leftX + clipLeftOffset;
                const clipRight = rightX - clipRightOffset;
                const clipWidth = Math.max(0, clipRight - clipLeft);

                ctx.rect(clipLeft, -canvas.height, clipWidth, canvas.height * 2);
                ctx.clip();

                ctx.lineJoin = safeRadius > 0 ? 'round' : 'miter';

                for (let i = 0; i < N; i++) {
                    let cx = L + actualGap + actualDashLen / 2 + i * (actualDashLen + actualGap);
                    const dPts = [
                        { x: cx - actualDashLen / 2, y: -halfLine },
                        { x: cx + actualDashLen / 2, y: -halfLine },
                        { x: cx + actualDashLen / 2, y: halfLine },
                        { x: cx - actualDashLen / 2, y: halfLine }
                    ];
                    drawRoundedPolygon(dPts, safeRadius);
                    if (bWidth > 0) ctx.stroke();
                    ctx.fill();
                }
                ctx.restore();

                ctx.lineJoin = safeRadius > 0 ? 'round' : 'bevel';

                const leftPts = [
                    { x: leftX - baseLen, y: 0 },
                    { x: leftX, y: -baseLen },
                    { x: leftX, y: -halfLine },
                    { x: leftX + currentTailLen, y: -halfLine },
                    { x: leftX + currentTailLen, y: halfLine },
                    { x: leftX, y: halfLine },
                    { x: leftX, y: baseLen }
                ];
                drawRoundedPolygon(leftPts, safeRadius);
                if (bWidth > 0) ctx.stroke();
                ctx.fill();

                const rightPts = [
                    { x: rightX + baseLen, y: 0 },
                    { x: rightX, y: baseLen },
                    { x: rightX, y: halfLine },
                    { x: rightX - currentTailLen, y: halfLine },
                    { x: rightX - currentTailLen, y: -halfLine },
                    { x: rightX, y: -halfLine },
                    { x: rightX, y: -baseLen }
                ];
                drawRoundedPolygon(rightPts, safeRadius);
                if (bWidth > 0) ctx.stroke();
                ctx.fill();

            } else {
                for (let i = 0; i < N; i++) {
                    let dLeft = L + actualGap + i * (actualDashLen + actualGap);
                    let dRight = dLeft + actualDashLen;

                    let drawLeft = Math.max(dLeft, leftX);
                    let drawRight = Math.min(dRight, rightX);

                    if (drawRight > drawLeft) {
                        let currentDashWidth = drawRight - drawLeft;
                        let dynRadius = Math.min(safeRadius, currentDashWidth / 2, halfLine);

                        ctx.lineJoin = dynRadius > 0 ? 'round' : 'miter';
                        const dPts = [
                            { x: drawLeft, y: -halfLine },
                            { x: drawRight, y: -halfLine },
                            { x: drawRight, y: halfLine },
                            { x: drawLeft, y: halfLine }
                        ];
                        drawRoundedPolygon(dPts, dynRadius);
                        if (bWidth > 0) ctx.stroke();
                        ctx.fill();
                    }
                }
            }

        } else {
            let safeRadius = Math.min(radius, scaledSize / 3);
            let pts = [];

            if (mostrarSetas) {
                pts = [
                    { x: leftX - baseLen, y: 0 },
                    { x: leftX, y: -baseLen },
                    { x: leftX, y: -halfLine },
                    { x: rightX, y: -halfLine },
                    { x: rightX, y: -baseLen },
                    { x: rightX + baseLen, y: 0 },
                    { x: rightX, y: baseLen },
                    { x: rightX, y: halfLine },
                    { x: leftX, y: halfLine },
                    { x: leftX, y: baseLen }
                ];
            } else {
                safeRadius = Math.min(radius, Math.abs(rightX - leftX) / 2, halfLine);
                pts = [
                    { x: leftX, y: -halfLine },
                    { x: rightX, y: -halfLine },
                    { x: rightX, y: halfLine },
                    { x: leftX, y: halfLine }
                ];
            }

            ctx.lineJoin = safeRadius > 0 ? 'round' : 'bevel';
            drawRoundedPolygon(pts, safeRadius);

            ctx.fillStyle = fill;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = bWidth;
            if (bWidth > 0) ctx.stroke();
            ctx.fill();
        }
    }

    if (phase3 > 0 && mostrarTexto) {
        ctx.save();

        let textX = (leftX + rightX) / 2;
        if (textPos === 'ponta') {
            if (origin === 'centro' || origin === 'esquerda') textX = rightX;
            else if (origin === 'direita') textX = leftX;
        }

        if (animTexto === 'expandir_corte') {
            ctx.beginPath();
            const maxH = 500;
            const ext = mostrarSetas ? baseLen : halfLine;
            ctx.rect(leftX - ext, -maxH / 2, (rightX - leftX) + (ext * 2), maxH);
            ctx.clip();
        }

        ctx.translate(textX, 0);

        let totalAngle = angle % 360;
        if (totalAngle < 0) totalAngle += 360;

        let isUpsideDown = (totalAngle > 90 && totalAngle < 270);
        let finalOffset = 0;

        const offsetRef = mostrarSetas ? baseLen : halfLine;
        const afastamentoBase = offsetRef + bWidth + distanciaTexto + (tamanhoFonte / 2.5);

        let dirMult = textoAbaixo ? 1 : -1;

        if (isUpsideDown) {
            ctx.rotate(Math.PI);
            dirMult *= -1;
        }

        ctx.rotate(rotacaoTexto * Math.PI / 180);

        finalOffset = afastamentoBase * dirMult;
        ctx.translate(0, finalOffset);

        if (animTexto === 'surgir') {
            ctx.globalAlpha = phase3;
        } else if (animTexto === 'expandir_zoom') {
            ctx.globalAlpha = phase3;
            let scaleText = easings.easeOut(phase3);
            ctx.scale(scaleText, scaleText);
        }

        ctx.font = "bold " + tamanhoFonte + "px 'Andy', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (bWidth > 0) {
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.lineWidth = bWidth;
            ctx.strokeStyle = stroke;
            ctx.strokeText(textCompleto, 0, 0);
        }

        ctx.fillStyle = textColor;
        ctx.fillText(textCompleto, 0, 0);

        ctx.restore();
    }

    ctx.restore();
}

function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const duration = parseInt(document.getElementById('velocidade').value);

    let rawProgress = (timestamp - startTime) / duration;
    if (rawProgress > 1) rawProgress = 1;

    drawFrame(rawProgress);

    if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
    } else {
        animationFrame = null;
        if (isRecording) setTimeout(stopRecording, 400);
    }
}

function playAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    startTime = null;
    animationFrame = requestAnimationFrame(animate);
}

function saveConfig() {
    const config = {};
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox') {
                config[id] = el.checked;
            } else {
                config[id] = el.value;
            }
        }
    });
    localStorage.setItem('terrariaMedidorConfigPTBR', JSON.stringify(config));
}

function loadConfig() {
    const configStr = localStorage.getItem('terrariaMedidorConfigPTBR');
    if (configStr) {
        const config = JSON.parse(configStr);
        for (const key in config) {
            const el = document.getElementById(key);
            if (el) {
                if (el.type === 'checkbox') el.checked = config[key];
                else el.value = config[key];

                if (key === 'tipoLinha') {
                    const panel = document.getElementById('controlesPontilhado');
                    if (panel) panel.style.display = el.value === 'pontilhada' ? 'flex' : 'none';
                }
            }
        }
    }
    updateCanvasSize();
}

// Inicializa Tela
exportOriginalWidth = parseInt(document.getElementById('canvasWidth').value) || 1920;
exportOriginalHeight = parseInt(document.getElementById('canvasHeight').value) || 1080;

let mediaRecorder;
let recordedChunks = [];

function exportVideo() {
    const tipoExportacao = document.getElementById('tipoExportacao').value;
    const qualidade = parseInt(document.getElementById('qualidadeExportacao').value) || 50000000;

    if (tipoExportacao === 'objeto') {
        const blocks = Math.floor(parseFloat(document.getElementById('tamanho').value)) || 1;
        const distance = blocks * 16;
        const baseArrowSize = parseFloat(document.getElementById('tamanhoSeta').value);
        const bWidth = parseFloat(document.getElementById('borderWidth').value);
        const zoom = parseFloat(document.getElementById('zoom').value);
        const angle = parseInt(document.getElementById('angulo').value);
        const tamanhoFonte = parseFloat(document.getElementById('tamanhoFonte').value);
        const distTexto = parseFloat(document.getElementById('distanciaTexto').value);
        const mostrarSetas = document.getElementById('mostrarSetas').checked;
        const mostrarTexto = document.getElementById('mostrarTexto').checked;
        const halfLine = parseFloat(document.getElementById('espessuraLinha').value) / 2;

        const baseLen = (baseArrowSize * Math.SQRT2) / 2;

        let wObj = distance + (mostrarSetas ? baseLen * 2 : 0) + bWidth * 2;
        let hObj = (mostrarSetas ? baseLen * 2 : halfLine * 2) + bWidth * 2;

        if (mostrarTexto) {
            const offsetRef = mostrarSetas ? baseLen : halfLine;
            const afastamento = offsetRef + bWidth + distTexto + tamanhoFonte;
            hObj = Math.max(hObj, afastamento * 2);
        }

        wObj *= zoom;
        hObj *= zoom;

        const rad = angle * Math.PI / 180;
        let finalW = Math.abs(wObj * Math.cos(rad)) + Math.abs(hObj * Math.sin(rad));
        let finalH = Math.abs(wObj * Math.sin(rad)) + Math.abs(hObj * Math.cos(rad));

        finalW += 60;
        finalH += 60;

        canvas.width = Math.ceil(finalW);
        canvas.height = Math.ceil(finalH);
    } else {
        canvas.width = exportOriginalWidth;
        canvas.height = exportOriginalHeight;
    }

    const stream = canvas.captureStream(60);
    // CONFIGURAÇÃO DO BITRATE APLICADA AQUI
    const options = {
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: qualidade
    };

    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        alert('Erro: Seu navegador não suporta exportação WebM com transparência (VP9). Use o Chrome.');
        return;
    }

    recordedChunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = handleStop;

    isRecording = true;
    exportButton.disabled = true;
    exportButton.innerText = "Gerando o WebM...";
    mediaRecorder.start();
    playAnimation();
}

function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
    exportButton.innerText = "Exportar WebM";
    exportButton.disabled = false;
}

function handleStop() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = `medida_terraria_${document.getElementById('tamanho').value}_blocos.webm`;
    a.click();
    window.URL.revokeObjectURL(url);

    canvas.width = exportOriginalWidth;
    canvas.height = exportOriginalHeight;
    drawFrame(1);
}

loadConfig();