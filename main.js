import { 
    initParticles, 
    toggleTheme, 
    setupMoneyInputs, 
    calculateBalance,
    goToStep1,
    goToStep2,
    goToStep3
} from './ui-components.js';

import { 
    updateModelDropdown, 
    displayEquipmentDetails, 
    validateBuyerForm, 
    validateEquipmentForm, 
    validatePaymentForm 
} from './form-handlers.js';

import { generateContract } from './contract-generator.js';

let contratoTemplate = '';
let pdfDocument = null;
let pdfFileName = '';
let isDarkMode = localStorage.getItem('darkMode') === 'true';

const loadContractTemplate = async () => {
    try {
        const response = await fetch('/CONTRATO DE COMPRA E VENDA E TERMO GARANTIA DE MÁQUINAS E EQUIPAMENTOS.txt');
        contratoTemplate = await response.text();
    } catch (error) {
        alert("Erro ao carregar o modelo de contrato.");
        contratoTemplate = '';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure extenso is loaded
    if (typeof window.extenso !== 'function') {
        window.extenso = function(num) { return String(num); };
    }

    await loadContractTemplate();

    initParticles(isDarkMode);

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    }

    setupMoneyInputs();
    calculateBalance();
    initEventListeners();
});

function initEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        isDarkMode = toggleTheme();
        initParticles(isDarkMode);
    });

    // Buyer form
    ['nome', 'cpf', 'cnpj', 'inscricao_estadual', 'endereco'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', validateBuyerForm);
    });
    validateBuyerForm();

    // Equipment form
    document.getElementById('tipo_equipamento').addEventListener('change', function () {
        updateModelDropdown();
        validateEquipmentForm();
    });
    document.getElementById('modelo').addEventListener('change', function () {
        displayEquipmentDetails();
        validateEquipmentForm();
    });
    document.getElementById('quantidade').addEventListener('input', validateEquipmentForm);
    validateEquipmentForm();

    // Payment form
    document.getElementById('valor_total').addEventListener('input', function () {
        calculateBalance();
        validatePaymentForm();
    });
    document.getElementById('valor_sinal').addEventListener('input', function () {
        calculateBalance();
        validatePaymentForm();
    });
    validatePaymentForm();

    // Navigation
    document.getElementById('step1-next').addEventListener('click', () => goToStep2(validateBuyerForm));
    document.getElementById('step2-prev').addEventListener('click', goToStep1);
    document.getElementById('step2-next').addEventListener('click', () => goToStep3(validateEquipmentForm));
    document.getElementById('step3-prev').addEventListener('click', () => goToStep2(validateBuyerForm));

    // Generate contract
    document.getElementById('generate-contract').addEventListener('click', async () => {
        document.getElementById('loading-overlay').style.display = 'flex';
        try {
            const result = await generateContract(validatePaymentForm, contratoTemplate);
            if (result && result.pdf) {
                pdfDocument = result.pdf;
                pdfFileName = result.fileName;
                document.getElementById('step3-container').style.display = 'none';
                document.getElementById('success-container').style.display = 'flex';
                // Auto download with formatted file name
                pdfDocument.save(pdfFileName);
            } else {
                alert('Ocorreu um erro ao gerar o contrato. Por favor, revise os dados e tente novamente.');
            }
        } catch (error) {
            alert('Ocorreu um erro ao gerar o contrato. Por favor, tente novamente.');
        } finally {
            document.getElementById('loading-overlay').style.display = 'none';
        }
    });

    // Download manual
    document.getElementById('download-contract').addEventListener('click', () => {
        if (!pdfDocument) {
            alert('Erro: Documento não gerado.');
            return;
        }
        try {
            pdfDocument.save(pdfFileName || `Contrato_TLM.pdf`);
        } catch (error) {
            alert('Ocorreu um erro ao fazer o download do contrato. Por favor, tente novamente.');
        }
    });

    // New contract
    document.getElementById('new-contract').addEventListener('click', resetForm);
}

function resetForm() {
    document.getElementById('buyer-form').reset();
    document.getElementById('equipment-form').reset();
    document.getElementById('payment-form').reset();

    document.getElementById('equipment-details').innerHTML = '';
    document.getElementById('modelo').innerHTML = '<option value="">Selecione o modelo</option>';
    document.getElementById('modelo').disabled = true;

    pdfDocument = null;
    pdfFileName = '';

    document.getElementById('success-container').style.display = 'none';
    document.getElementById('step1-container').style.display = 'block';
    document.getElementById('step2-container').style.display = 'none';
    document.getElementById('step3-container').style.display = 'none';

    document.getElementById('step1').classList.add('active');
    document.getElementById('step1').classList.remove('completed');
    document.getElementById('step2').classList.remove('active', 'completed');
    document.getElementById('step3').classList.remove('active', 'completed');

    validateBuyerForm();
    validateEquipmentForm();
    validatePaymentForm();

    setupMoneyInputs();
    calculateBalance();
}