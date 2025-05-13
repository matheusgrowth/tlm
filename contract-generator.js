import { parseCurrencyToNumber, getMonthName } from './utils.js';

// Get all form data with fallback and cleanup for contract
const getFormData = () => {
    // Buyer data
    const nome = (document.getElementById('nome')?.value || '').trim();
    const cpf = (document.getElementById('cpf')?.value || '').trim();
    const cnpj = (document.getElementById('cnpj')?.value || '').trim();
    const inscricaoEstadual = (document.getElementById('inscricao_estadual')?.value || '').trim();
    const endereco = (document.getElementById('endereco')?.value || '').trim();

    // Equipment data
    const tipoEquipamento = (document.getElementById('tipo_equipamento')?.value || '').trim();
    const modelo = (document.getElementById('modelo')?.value || '').trim();
    const quantidade = (document.getElementById('quantidade')?.value || '').trim();

    // Accessories and bucket
    const selectedAccessories = [];
    document.querySelectorAll('input[name="accessories"]:checked').forEach(checkbox => {
        selectedAccessories.push(checkbox.value);
    });
    let customBucketSize = '';
    const customizeBucketCheckbox = document.getElementById('customize-bucket');
    if (customizeBucketCheckbox && customizeBucketCheckbox.checked) {
        const bucketSize = document.getElementById('bucket-size').value;
        customBucketSize = bucketSize + ' m³';
    }
    const adicionais = (document.getElementById('adicionais')?.value || '').trim();
    let adicionaisText = adicionais ? adicionais : '';
    if (selectedAccessories.length > 0) {
        adicionaisText += (adicionaisText ? ', ' : '') + 'Acessórios selecionados: ' + selectedAccessories.join(', ');
    }
    if (adicionaisText.trim() === '') {
        adicionaisText = 'Nenhum acessório adicional';
    }

    // Equipment details
    const equipmentDetails = window.equipmentDatabase?.[tipoEquipamento]?.find(item => item.Modelo === modelo) || {};

    // Payment fields
    const valorTotal = parseCurrencyToNumber(document.getElementById('valor_total')?.value || '');
    const valorSinal = parseCurrencyToNumber(document.getElementById('valor_sinal')?.value || '');
    const valorSaldo = Math.max(0, valorTotal - valorSinal);
    const formaPagamentoEl = document.querySelector('input[name="payment_method"]:checked');
    const formaPagamento = formaPagamentoEl ? formaPagamentoEl.value : '';

    // Date format
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()} de ${getMonthName(currentDate.getMonth())} de ${currentDate.getFullYear()}`;

    let cpf_cnpj = '';
    if (cpf && cnpj) {
        cpf_cnpj = `${cpf} / ${cnpj}`;
    } else if (cpf) {
        cpf_cnpj = cpf;
    } else if (cnpj) {
        cpf_cnpj = cnpj;
    }

    return {
        NOME_COMPRADOR: nome,
        CPF_CNPJ_COMPRADOR: cpf_cnpj,
        INSCRICAO_ESTADUAL: inscricaoEstadual,
        ENDERECO_COMPLETO: endereco,
        TIPO_EQUIPAMENTO: tipoEquipamento,
        MODELO: modelo,
        MARCA: equipmentDetails.Marca || 'TLM',
        ANO_FABRICACAO: equipmentDetails['Ano de Fabricação'] || new Date().getFullYear(),
        PESO_OPERACIONAL: (equipmentDetails['Peso Operacional (kg)'] || '').replace(' kg', ''),
        CAPACIDADE_CARGA: (equipmentDetails['Capacidade de Carga (kg)'] || '').replace(' kg', ''),
        MARCA_MOTOR: (equipmentDetails.Motor || '').split(' ')[0],
        POTENCIA_CV: equipmentDetails['Potência (CV)'] || '',
        QUANTIDADE: quantidade,
        QUANTIDADE_EXTENSO: typeof window.extenso === 'function' ? window.extenso(parseInt(quantidade) || 0) : quantidade,
        DESCRICAO_ADICIONAIS: adicionaisText,
        CONCHA: customBucketSize || (equipmentDetails['Concha'] || ''),
        VALOR_TOTAL: valorTotal > 0 ? valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        VALOR_TOTAL_EXTENSO: typeof window.extenso === 'function' ? window.extenso(valorTotal) : valorTotal,
        VALOR_SINAL: valorSinal > 0 ? valorSinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        VALOR_SINAL_EXTENSO: typeof window.extenso === 'function' ? window.extenso(valorSinal) : valorSinal,
        VALOR_SALDO: valorSaldo > 0 ? valorSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        VALOR_SALDO_EXTENSO: typeof window.extenso === 'function' ? window.extenso(valorSaldo) : valorSaldo,
        FORMA_PAGAMENTO: formaPagamento,
        DATA_CONTRATO: formattedDate
    };
};

// Template rendering
const fillContractTemplate = (contratoTemplate, formData) => {
    let filled = contratoTemplate;
    for (const [key, value] of Object.entries(formData)) {
        filled = filled.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return filled;
};

// Utility for adding watermark (marca d'agua) - can use the logo faded repeated
async function addWatermark(doc, pageCount, logoUrl) {
    let imgData = null;
    // Load the logo
    if (!window.__tlmLogoWatermark) {
        imgData = await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous'; // avoid CORS problems
            img.src = logoUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                ctx.globalAlpha = 0.07;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
        });
        window.__tlmLogoWatermark = imgData;
    } else {
        imgData = window.__tlmLogoWatermark;
    }
    // Place watermark on every page
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.addImage(imgData, 'PNG', 35, 90, 140, 50, undefined, 'NONE');
    }
}

// Colors & Styling constants
const BRAND_ORANGE = [251, 176, 0];
const DARK = [30, 28, 28];
const BORDER_COLOR = [251, 176, 0];
const CONTRACT_FRAME_MARGIN = 8;
const CONTRACT_FRAME_RADIUS = 7;

// PDF GENERATION with full brand document formatting, visual identity, frame, header, watermark etc
const generatePDF = async (contractContent, formData) => {
    if (!window.jspdf?.jsPDF) throw new Error('jsPDF lib not loaded');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 17;
    const maxWidth = 176;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- HEADER
    // Logo
    try {
        await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.src = '/TLM Logo H.png';
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
        doc.addImage('/TLM Logo H.png', 'PNG', margin, CONTRACT_FRAME_MARGIN + 3, 42, 18);
    } catch(e){ /* logo optional */ }

    // Draw decorative top bar and header
    doc.setDrawColor(...BRAND_ORANGE);
    doc.setFillColor(...BRAND_ORANGE);
    doc.roundedRect(CONTRACT_FRAME_MARGIN, CONTRACT_FRAME_MARGIN, pageWidth-2*CONTRACT_FRAME_MARGIN, pageHeight-2*CONTRACT_FRAME_MARGIN, CONTRACT_FRAME_RADIUS, CONTRACT_FRAME_RADIUS, 'S'); // Frame
    doc.setFillColor(...BRAND_ORANGE);
    doc.roundedRect(CONTRACT_FRAME_MARGIN, CONTRACT_FRAME_MARGIN, pageWidth-2*CONTRACT_FRAME_MARGIN, 13, CONTRACT_FRAME_RADIUS, CONTRACT_FRAME_RADIUS, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.setFontSize(16);
    doc.text('CONTRATO DE COMPRA E VENDA DE MÁQUINAS E EQUIPAMENTOS', pageWidth/2, CONTRACT_FRAME_MARGIN + 9, { align: 'center', baseline: 'middle' });

    // Subtitle (client name, equipment, date)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    let subtitle = `${formData.NOME_COMPRADOR || ''} - ${formData.TIPO_EQUIPAMENTO || ''} ${formData.MODELO || ''}`;
    if(formData.DATA_CONTRATO) subtitle += ` - ${formData.DATA_CONTRATO}`;
    doc.text(subtitle, pageWidth/2, CONTRACT_FRAME_MARGIN + 16, { align: 'center', baseline: 'bottom' });

    let y = CONTRACT_FRAME_MARGIN + 24;

    // --- CONTRACT CONTENT
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    // Split by paragraph (remove empty lines)
    const paragraphs = contractContent.split('\n').filter(l => l.trim().length > 0);

    for (let i = 0; i < paragraphs.length; i++) {
        let p = paragraphs[i].trim();

        // Big sections/titles (all uppercase and sufficiently long)
        if (p === p.toUpperCase() && p.length > 7) {
            y += 3;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            let lines = doc.splitTextToSize(p, maxWidth);
            if(y + (lines.length*7) > pageHeight - CONTRACT_FRAME_MARGIN - 22){ 
                doc.addPage(); 
                y = CONTRACT_FRAME_MARGIN + 18; 
            }
            doc.setTextColor(...BRAND_ORANGE);
            doc.text(lines, margin, y);
            y += lines.length * 6 + 2;
            doc.setTextColor(50,50,50);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            continue;
        }

        // Cláusulas
        if (p.startsWith('Cláusula')) {
            let pos = p.indexOf('.');
            let clauseTitle = pos > 0 ? p.slice(0, pos + 1) : p;
            let clauseRest = pos > 0 ? p.slice(pos + 1).trim() : '';
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40,40,40);
            doc.text(clauseTitle, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40,40,40);
            let lines = doc.splitTextToSize(clauseRest, maxWidth-17);
            doc.text(lines, margin + 17, y);
            y += Math.max(lines.length * 5.9, 9) + 2;
            continue;
        }

        // Parties highlight (VENDEDORA / COMPRADOR)
        if (p.startsWith('VENDEDORA:') || p.startsWith('COMPRADOR')) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...BRAND_ORANGE);
            let lines = doc.splitTextToSize(p, maxWidth);
            if(y + (lines.length*7) > pageHeight - CONTRACT_FRAME_MARGIN - 20){ 
                doc.addPage(); 
                y = CONTRACT_FRAME_MARGIN + 18;
            }
            doc.text(lines, margin, y);
            y += lines.length * 6 + 2;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50,50,50);
            continue;
        }

        // Normal paragraphs
        let lines = doc.splitTextToSize(p, maxWidth);
        if(y + (lines.length*6) > pageHeight - CONTRACT_FRAME_MARGIN - 18){ 
            doc.addPage(); 
            y = CONTRACT_FRAME_MARGIN + 18;
        }
        doc.text(lines, margin, y);
        y += lines.length * 6 + 2;
    }

    // --- SIGNATURE PAGE
    doc.addPage();
    y = CONTRACT_FRAME_MARGIN + 30;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(35,35,35);
    doc.setFontSize(11);
    doc.text('Florianópolis, ' + formData.DATA_CONTRATO, pageWidth/2, y, { align: 'center' });
    y += 23;

    // Decorative lines and signature labels
    let x_left = margin, x_right = pageWidth - margin;
    let blockW = 72;
    // Draw lines
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.55);
    doc.line(x_left, y, x_left+blockW, y);
    doc.line(x_right-blockW, y, x_right, y);

    doc.setFontSize(10);
    doc.setTextColor(40,40,40);
    doc.text('BTI COMEX IMPORTAÇÃO, EXPORTAÇÃO', x_left+blockW/2, y+7, { align: 'center' });
    doc.text('E DISTRIBUIÇÃO LTDA', x_left+blockW/2, y+12, { align: 'center' });
    doc.text('VENDEDORA', x_left+blockW/2, y+18, { align: 'center' });
    doc.text(String(formData.NOME_COMPRADOR), x_right-blockW/2, y+7, { align: 'center' });
    doc.text('COMPRADOR(A)', x_right-blockW/2, y+18, { align: 'center' });

    y += 35;
    doc.line(x_left, y, x_left+blockW, y);
    doc.line(x_right-blockW, y, x_right, y);
    doc.text('Testemunha', x_left+blockW/2, y+6, { align: 'center' });
    doc.text('CPF:', x_left+blockW/2, y+14, { align: 'center' });
    doc.text('Testemunha', x_right-blockW/2, y+6, { align: 'center' });
    doc.text('CPF:', x_right-blockW/2, y+14, { align: 'center' });

    // --- WATERMARK (marca d'água) on all pages
    await addWatermark(doc, doc.internal.getNumberOfPages(), '/TLM Logo H.png');

    // --- FOOTER ON EVERY PAGE
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...BORDER_COLOR);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - CONTRACT_FRAME_MARGIN + 2, {align:'right'});
        doc.setTextColor(120, 120, 120);
        doc.text('TLM Equipamentos | www.tlmequipamentos.com.br | contato@tlmequipamentos.com.br', margin, pageHeight - CONTRACT_FRAME_MARGIN + 2);
    }

    // --- TOP HEADER BAND (on all pages but signature page) 
    for(let i=1; i<=pageCount-1; i++){
        doc.setPage(i);
        doc.setDrawColor(...BRAND_ORANGE);
        doc.setFillColor(...BRAND_ORANGE);
        doc.roundedRect(CONTRACT_FRAME_MARGIN, CONTRACT_FRAME_MARGIN, pageWidth-2*CONTRACT_FRAME_MARGIN, 13, CONTRACT_FRAME_RADIUS, CONTRACT_FRAME_RADIUS, 'F');
    }

    // --- PAGE BORDER ON ALL PAGES
    for(let i=1; i<=pageCount; i++){
        doc.setPage(i);
        doc.setDrawColor(...BORDER_COLOR);
        doc.setLineWidth(1.1);
        doc.roundedRect(CONTRACT_FRAME_MARGIN, CONTRACT_FRAME_MARGIN, pageWidth-2*CONTRACT_FRAME_MARGIN, pageHeight-2*CONTRACT_FRAME_MARGIN, CONTRACT_FRAME_RADIUS, CONTRACT_FRAME_RADIUS, 'S');
    }

    return doc;
};

const generateContract = async (validatePaymentForm, contratoTemplate) => {
    if (!validatePaymentForm()) return null;
    try {
        const formData = getFormData();
        const contractContent = fillContractTemplate(contratoTemplate, formData);
        const pdf = await generatePDF(contractContent, formData);
        return {
            pdf,
            fileName: `Contrato_TLM_${formData.NOME_COMPRADOR.replace(/[^a-zA-Z0-9]/g,'_')}_${formData.TIPO_EQUIPAMENTO||''}_${formData.MODELO||''}_${formData.DATA_CONTRATO.replace(/\s+de\s+/g,'_').replace(/\./g,'')}.pdf`
        };
    } catch (error) {
        alert('Erro ao gerar o PDF do contrato. Verifique os dados preenchidos e tente novamente.');
        return null;
    }
};

export { getFormData, generateContract };