import { isValidCpf, isValidCnpj, setInvalidField, setValidField, parseCurrencyToNumber } from './utils.js';

// Update equipment model dropdown based on equipment type
const updateModelDropdown = () => {
    const tipoEquipamento = document.getElementById('tipo_equipamento').value;
    const modeloDropdown = document.getElementById('modelo');
    
    // Clear current dropdown
    modeloDropdown.innerHTML = '<option value="">Selecione o modelo</option>';
    
    // Enable/disable model dropdown
    if (tipoEquipamento) {
        modeloDropdown.disabled = false;
        
        // Fill dropdown with corresponding models from the database
        const models = window.equipmentDatabase[tipoEquipamento];
        
        if (models && models.length) {
            models.forEach(item => {
                const option = document.createElement('option');
                option.value = item.Modelo;
                option.textContent = item.Modelo;
                modeloDropdown.appendChild(option);
            });
        } else {
            console.error(`No models found for ${tipoEquipamento}`);
        }
    } else {
        modeloDropdown.disabled = true;
    }
    
    // Clear equipment details
    document.getElementById('equipment-details').innerHTML = '';
};

// Display equipment details based on selected model
const displayEquipmentDetails = () => {
    const tipoEquipamento = document.getElementById('tipo_equipamento').value;
    const modeloSelecionado = document.getElementById('modelo').value;
    const detailsContainer = document.getElementById('equipment-details');
    
    // Clear current details
    detailsContainer.innerHTML = '';
    
    if (!tipoEquipamento || !modeloSelecionado) return;
    
    // Find selected equipment in database
    const equipment = window.equipmentDatabase[tipoEquipamento].find(item => item.Modelo === modeloSelecionado);
    
    if (!equipment) return;
    
    // Create equipment card with details
    const equipmentIcon = tipoEquipamento === 'Empilhadeira' ? 
        '/equipment-icons/empilhadeiras.png' : 
        '/equipment-icons/carregadeiras.png';
    
    // Create selectable accessory options
    let accessoriesOptionsHTML = '';
    if (equipment['Acessórios Opcionais']) {
        const accessories = equipment['Acessórios Opcionais'].split('; ');
        accessoriesOptionsHTML = `
            <div class="accessories-options">
                <h4>Selecione os Acessórios Opcionais:</h4>
                <div class="accessories-grid">
                    ${accessories.map(acc => `
                        <div class="accessory-option">
                            <input type="checkbox" id="acc-${acc.replace(/\s+/g, '-').toLowerCase()}" name="accessories" value="${acc}">
                            <label for="acc-${acc.replace(/\s+/g, '-').toLowerCase()}">${acc}</label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Create bucket size customization option
    let bucketCustomizationHTML = '';
    if (equipment['Concha']) {
        const defaultBucketSize = parseFloat(equipment['Concha'].replace(' m³', ''));
        bucketCustomizationHTML = `
            <div class="bucket-customization">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="customize-bucket"> Personalizar tamanho da concha
                    </label>
                </div>
                <div class="bucket-slider-container" style="display: none;">
                    <label for="bucket-size">Tamanho da Concha: <span id="bucket-size-value">${defaultBucketSize}</span> m³</label>
                    <input type="range" id="bucket-size" min="${Math.max(0.1, defaultBucketSize - 1)}" max="${defaultBucketSize + 1}" step="0.1" value="${defaultBucketSize}">
                </div>
            </div>
        `;
    }
    
    const detailsHTML = `
        <div class="equipment-card fadeIn">
            <div class="equipment-image">
                <img src="${equipmentIcon}" alt="${tipoEquipamento} ${modeloSelecionado}">
            </div>
            <div class="equipment-info">
                <h3>${equipment.Marca} ${equipment.Modelo}</h3>
                <div class="specs-grid">
                    <div class="spec-item">
                        <span class="spec-label">Ano de Fabricação</span>
                        <span class="spec-value">${equipment['Ano de Fabricação']}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Peso Operacional</span>
                        <span class="spec-value">${equipment['Peso Operacional (kg)']}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Capacidade de Carga</span>
                        <span class="spec-value">${equipment['Capacidade de Carga (kg)']}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Motor</span>
                        <span class="spec-value">${equipment.Motor}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Potência</span>
                        <span class="spec-value">${equipment['Potência (CV)']}</span>
                    </div>
                    ${equipment['Tipo de Combustível'] ? `
                    <div class="spec-item">
                        <span class="spec-label">Combustível</span>
                        <span class="spec-value">${equipment['Tipo de Combustível']}</span>
                    </div>
                    ` : ''}
                    ${equipment['Concha'] ? `
                    <div class="spec-item">
                        <span class="spec-label">Concha</span>
                        <span class="spec-value" id="display-concha-value">${equipment['Concha']}</span>
                    </div>
                    ` : ''}
                </div>
                ${bucketCustomizationHTML}
                ${(equipment['Acessórios Padrão']) ? `
                <div class="accessories-section" style="margin-top: 15px;">
                    ${equipment['Acessórios Padrão'] ? `
                    <div class="accessory-item">
                        <span class="spec-label">Acessórios Padrão</span>
                        <span class="spec-value">${equipment['Acessórios Padrão']}</span>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                ${accessoriesOptionsHTML}
            </div>
        </div>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    
    // Setup bucket size customization functionality
    const customizeBucketCheckbox = document.getElementById('customize-bucket');
    if (customizeBucketCheckbox) {
        customizeBucketCheckbox.addEventListener('change', function() {
            const sliderContainer = document.querySelector('.bucket-slider-container');
            sliderContainer.style.display = this.checked ? 'block' : 'none';
        });
        
        const bucketSizeSlider = document.getElementById('bucket-size');
        const bucketSizeValue = document.getElementById('bucket-size-value');
        const displayConchaValue = document.getElementById('display-concha-value');
        
        bucketSizeSlider.addEventListener('input', function() {
            bucketSizeValue.textContent = this.value;
            displayConchaValue.textContent = `${this.value} m³`;
        });
    }
};

// Validate buyer form
const validateBuyerForm = () => {
    let isValid = true;
    const nome = document.getElementById('nome');
    const cpf = document.getElementById('cpf');
    const cnpj = document.getElementById('cnpj');
    const inscricao = document.getElementById('inscricao_estadual');
    const endereco = document.getElementById('endereco');
    
    // Validate name
    if (!nome.value.trim()) {
        setInvalidField(nome, 'Nome é obrigatório');
        isValid = false;
    } else if (nome.value.trim().length < 3) {
        setInvalidField(nome, 'Nome deve ter pelo menos 3 caracteres');
        isValid = false;
    } else {
        setValidField(nome);
    }
    
    // Validate CPF
    if (!cpf.value.trim()) {
        setInvalidField(cpf, 'CPF é obrigatório');
        isValid = false;
    } else if (!isValidCpf(cpf.value)) {
        setInvalidField(cpf, 'CPF inválido');
        isValid = false;
    } else {
        setValidField(cpf);
    }
    
    // Validate CNPJ
    if (!cnpj.value.trim()) {
        setInvalidField(cnpj, 'CNPJ é obrigatório');
        isValid = false;
    } else if (!isValidCnpj(cnpj.value)) {
        setInvalidField(cnpj, 'CNPJ inválido');
        isValid = false;
    } else {
        setValidField(cnpj);
    }
    
    // Validate IE
    if (!inscricao.value.trim()) {
        setInvalidField(inscricao, 'Inscrição Estadual é obrigatória');
        isValid = false;
    } else {
        setValidField(inscricao);
    }
    
    // Validate address
    if (!endereco.value.trim()) {
        setInvalidField(endereco, 'Endereço é obrigatório');
        isValid = false;
    } else if (endereco.value.trim().length < 10) {
        setInvalidField(endereco, 'Endereço deve ser completo');
        isValid = false;
    } else {
        setValidField(endereco);
    }
    
    // Enable/disable next button
    document.getElementById('step1-next').disabled = !isValid;
    
    return isValid;
};

// Validate equipment form
const validateEquipmentForm = () => {
    let isValid = true;
    const tipoEquipamento = document.getElementById('tipo_equipamento');
    const modelo = document.getElementById('modelo');
    const quantidade = document.getElementById('quantidade');
    
    // Validate equipment type
    if (!tipoEquipamento.value) {
        setInvalidField(tipoEquipamento, 'Selecione o tipo de equipamento');
        isValid = false;
    } else {
        setValidField(tipoEquipamento);
    }
    
    // Validate model
    if (!modelo.value) {
        setInvalidField(modelo, 'Selecione o modelo');
        isValid = false;
    } else {
        setValidField(modelo);
    }
    
    // Validate quantity
    if (!quantidade.value || parseInt(quantidade.value) < 1) {
        setInvalidField(quantidade, 'Quantidade deve ser pelo menos 1');
        isValid = false;
    } else {
        setValidField(quantidade);
    }
    
    // Enable/disable next button
    document.getElementById('step2-next').disabled = !isValid;
    
    return isValid;
};

// Validate payment form
const validatePaymentForm = () => {
    let isValid = true;
    const valorTotal = document.getElementById('valor_total');
    const valorSinal = document.getElementById('valor_sinal');
    
    const totalValue = parseCurrencyToNumber(valorTotal.value);
    const signalValue = parseCurrencyToNumber(valorSinal.value);
    
    // Validate total value
    if (totalValue <= 0) {
        setInvalidField(valorTotal, 'Valor total deve ser maior que zero');
        isValid = false;
    } else {
        setValidField(valorTotal);
    }
    
    // Validate signal value
    if (signalValue <= 0) {
        setInvalidField(valorSinal, 'Valor do sinal deve ser maior que zero');
        isValid = false;
    } else if (signalValue > totalValue) {
        setInvalidField(valorSinal, 'Sinal não pode ser maior que o valor total');
        isValid = false;
    } else {
        setValidField(valorSinal);
    }
    
    return isValid;
};

export { 
    updateModelDropdown, 
    displayEquipmentDetails, 
    validateBuyerForm, 
    validateEquipmentForm, 
    validatePaymentForm 
};