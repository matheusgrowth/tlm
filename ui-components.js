import { formatCurrency, parseCurrencyToNumber } from './utils.js';

// Initialize particles.js
const initParticles = (isDarkMode) => {
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: isDarkMode ? '#fbb000' : '#000000' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: false },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: isDarkMode ? '#fbb000' : '#000000',
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: true, mode: 'grab' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            },
            modes: {
                grab: { distance: 140, line_linked: { opacity: 1 } },
                push: { particles_nb: 4 }
            }
        },
        retina_detect: true
    });
};

// Toggle dark/light theme
const toggleTheme = () => {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    const themeIcon = document.getElementById('theme-toggle');
    themeIcon.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    // Update particles color
    if (window.pJSDom && window.pJSDom[0]) {
        window.pJSDom[0].pJS.particles.color.value = isDarkMode ? '#fbb000' : '#000000';
        window.pJSDom[0].pJS.particles.line_linked.color = isDarkMode ? '#fbb000' : '#000000';
        window.pJSDom[0].pJS.fn.particlesRefresh();
    }
    
    return isDarkMode;
};

// Configure money inputs with Brazilian Real format
const setupMoneyInputs = () => {
    const moneyInputs = document.querySelectorAll('.money-input');
    
    moneyInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            // Allow empty value
            let raw = e.target.value.replace(/\D/g, '');
            if (raw === '') { e.target.value = ''; return; }
            let value = (parseInt(raw) / 100).toFixed(2);
            e.target.value = formatCurrency(parseFloat(value));
        });

        input.addEventListener('focus', function(e) {
            // Select all on focus (nice for quick overwrite)
            setTimeout(() => { e.target.select(); }, 10);
        });

        input.addEventListener('blur', function(e) {
            let raw = e.target.value.replace(/\D/g, '');
            let value = (parseInt(raw) || 0) / 100;
            e.target.value = value === 0 ? '' : formatCurrency(value);
        });
    });
};

// Calculate balance based on total and sinal values (and update in real-time)
const calculateBalance = () => {
    const valorTotal = document.getElementById('valor_total');
    const valorSinal = document.getElementById('valor_sinal');
    const valorSaldo = document.getElementById('valor_saldo');
    // Defensive for possible nulls
    if (!(valorTotal && valorSinal && valorSaldo)) return;

    const totalValue = parseCurrencyToNumber(valorTotal.value);
    const signalValue = parseCurrencyToNumber(valorSinal.value);
    let balanceValue = 0;
    if (!isNaN(totalValue) && !isNaN(signalValue)) {
        balanceValue = Math.max(0, totalValue - signalValue);
    }
    valorSaldo.value = totalValue === 0 && signalValue === 0 ? '' : formatCurrency(balanceValue);
};

// Navigation functions
const goToStep1 = () => {
    document.getElementById('step1-container').style.display = 'block';
    document.getElementById('step2-container').style.display = 'none';
    document.getElementById('step3-container').style.display = 'none';
    document.getElementById('step1').classList.add('active');
    document.getElementById('step2').classList.remove('active', 'completed');
    document.getElementById('step3').classList.remove('active', 'completed');
};

const goToStep2 = (validateBuyerForm) => {
    if (!validateBuyerForm()) return;
    document.getElementById('step1-container').style.display = 'none';
    document.getElementById('step2-container').style.display = 'block';
    document.getElementById('step3-container').style.display = 'none';
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.add('active');
    document.getElementById('step3').classList.remove('active', 'completed');
};

const goToStep3 = (validateEquipmentForm) => {
    if (!validateEquipmentForm()) return;
    document.getElementById('step1-container').style.display = 'none';
    document.getElementById('step2-container').style.display = 'none';
    document.getElementById('step3-container').style.display = 'block';
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step2').classList.add('completed');
    document.getElementById('step3').classList.add('active');
};

export { 
    initParticles, 
    toggleTheme, 
    setupMoneyInputs, 
    calculateBalance,
    goToStep1,
    goToStep2,
    goToStep3
};