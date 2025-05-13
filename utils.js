// Utility functions for the application

// Format currency as Brazilian Real
const formatCurrency = (value) => {
    let amount = typeof value === 'string' ? parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) : value;
    if (isNaN(amount) || amount === 0) return '';
    return amount.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    });
};

// Parse currency value to number
const parseCurrencyToNumber = (value) => {
    if (!value || !value.replace) return 0;
    let clean = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    let number = parseFloat(clean);
    return isNaN(number) ? 0 : number;
};

// Check if CPF is valid
const isValidCpf = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.length === 11;
};

// Check if CNPJ is valid
const isValidCnpj = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.length === 14;
};

// Get month name in Portuguese
const getMonthName = (monthIndex) => {
    const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return months[monthIndex];
};

// Set field as invalid and show error message
const setInvalidField = (field, message) => {
    field.classList.add('invalid');
    field.classList.remove('valid');
    const errorMessage = field.nextElementSibling;
    if (errorMessage) errorMessage.textContent = message;
};

// Set field as valid and clear error message
const setValidField = (field) => {
    field.classList.remove('invalid');
    field.classList.add('valid');
    const errorMessage = field.nextElementSibling;
    if (errorMessage) errorMessage.textContent = '';
};

export { 
    formatCurrency, 
    parseCurrencyToNumber, 
    isValidCpf, 
    isValidCnpj, 
    getMonthName,
    setInvalidField,
    setValidField
};