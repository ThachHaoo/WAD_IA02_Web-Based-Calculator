document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LẤY CÁC THÀNH PHẦN GIAO DIỆN ---
    const mainDisplay = document.getElementById('main-display');
    const historyDisplay = document.getElementById('history-display');
    const buttonGrid = document.getElementById('button-grid');

    // --- 2. BIẾN TRẠNG THÁI (STATE) CỦA MÁY TÍNH ---
    const historyToggle = document.getElementById('history-toggle');
    const historyPanel = document.getElementById('history-panel');
    const historyContent = document.getElementById('history-content');
    const noHistoryMessage = document.getElementById('no-history-message');
    const clearHistoryButton = document.getElementById('clear-history-button');
    const mobileHistoryOverlay = document.getElementById('mobile-history-overlay');
    const tabHistory = document.getElementById('tab-history');
    const tabMemory = document.getElementById('tab-memory');
    const memoryContent = document.getElementById('memory-content');
    const noMemoryMessage = document.getElementById('no-memory-message');
    const clearMemoryButton = document.getElementById('clear-memory-button');
    const clearHistoryWrapper = document.getElementById('clear-history-wrapper');
    const clearMemoryWrapper = document.getElementById('clear-memory-wrapper');

    const btnMC = document.getElementById('btn-mc');
    const btnMR = document.getElementById('btn-mr');
    const btnMPlus = document.getElementById('btn-m-plus');
    const btnMMinus = document.getElementById('btn-m-minus');
    const btnMS = document.getElementById('btn-ms');
    const btnMDropdown = document.getElementById('btn-m-dropdown');

    let currentOperand = '0';
    let previousOperand = '';
    let operation = undefined;
    let readyToReset = false;
    
    let unaryHistory = undefined;
    let lastFullEquation = undefined;
    let calculationHistory = [];
    
    let lastOperationForEquals = undefined;
    let lastOperandForEquals = undefined;

    let memoryHistory = []; // Sẽ lưu một danh sách các số

    // --- 3. HÀM CẬP NHẬT GIAO DIỆN ---
    
    function getFormattedNumber(numberString) {
        if (numberString === '' || numberString === null || typeof numberString === 'undefined') {
            numberString = '0';
        }
        
        let formattedOperand;
        if (numberString.includes('.')) {
            const parts = numberString.split('.');
            const decimalPart = parts[1];
            const integerPart = parts[0] === '' ? '0' : parts[0]; 
            const formattedInteger = parseFloat(integerPart).toLocaleString('en-US');
            formattedOperand = `${formattedInteger}.${decimalPart}`;
        } else {
            formattedOperand = parseFloat(numberString).toLocaleString('en-US', {
                maximumFractionDigits: 10
            });
        }
        return formattedOperand;
    }
    
    function updateDisplay() {
        let valueToDisplay = currentOperand;
        if (currentOperand === '' && operation != null) {
            valueToDisplay = previousOperand;
        }
        
        mainDisplay.innerText = getFormattedNumber(valueToDisplay);

        if (lastFullEquation) {
            historyDisplay.innerText = lastFullEquation;
        } else if (unaryHistory) {
            if (unaryHistory.length > 30) {
                historyDisplay.innerText = '...' + unaryHistory.slice(-27);
            } else {
                historyDisplay.innerText = unaryHistory;
            }
        } else if (operation != null) {
            historyDisplay.innerText = `${getFormattedNumber(previousOperand)} ${operation}`;
        } else {
            historyDisplay.innerText = '\u00A0';
        }
    }

    // --- 3.5. HÀM CẬP NHẬT GIAO DIỆN LỊCH SỬ ---
    function updateHistoryDisplay() {
        if (calculationHistory.length === 0) {
            noHistoryMessage.classList.remove('hidden');
            historyContent.querySelectorAll('.history-item').forEach(item => item.remove());
        } else {
            noHistoryMessage.classList.add('hidden');
            historyContent.querySelectorAll('.history-item').forEach(item => item.remove());

            calculationHistory.slice().reverse().forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item py-1'; 
                
                const equationEl = document.createElement('div');
                equationEl.className = 'text-gray-500 text-sm truncate';
                equationEl.innerText = item.equation;
                
                const resultEl = document.createElement('div');
                resultEl.className = 'text-xl font-bold truncate';
                resultEl.innerText = getFormattedNumber(item.result);
                
                historyItem.appendChild(equationEl);
                historyItem.appendChild(resultEl);
                
                historyContent.appendChild(historyItem);
            });
        }
    }

    // --- 3.6. HÀM CẬP NHẬT GIAO DIỆN BỘ NHỚ ---
    function updateMemoryDisplay() {
        // Xóa nội dung cũ
        memoryContent.querySelectorAll('.memory-item').forEach(item => item.remove());

        if (memoryHistory.length === 0) {
            noMemoryMessage.classList.remove('hidden');
            // Tắt các nút MC, MR, M_Dropdown
            btnMC.disabled = true;
            btnMR.disabled = true;
            btnMDropdown.disabled = true;
        } else {
            noMemoryMessage.classList.add('hidden');
            // Bật các nút MC, MR, M_Dropdown
            btnMC.disabled = false;
            btnMR.disabled = false;
            btnMDropdown.disabled = false;

            // Thêm từng mục bộ nhớ vào (hiển thị ngược: mới nhất ở trên)
            memoryHistory.forEach((memValue) => {
                const memItem = document.createElement('div');
                memItem.className = 'memory-item py-2';
                
                const memValueEl = document.createElement('div');
                memValueEl.className = 'text-2xl font-bold truncate';
                memValueEl.innerText = getFormattedNumber(memValue.toString());
                
                
                memItem.appendChild(memValueEl);
                // Chèn vào đầu để mục mới nhất ở trên cùng
                memoryContent.appendChild(memItem); 
            });
        }
    }

    // --- 4. HÀM TÍNH TOÁN ---
    function calculate() {
        
        if (operation === undefined && lastOperationForEquals !== undefined) {
            operation = lastOperationForEquals;
            previousOperand = currentOperand;
            currentOperand = lastOperandForEquals;
        }

        let computation;

        // Kiểm tra nếu thiếu operand thì không tính
        if (previousOperand === '' || currentOperand === '') return true;

        const prev = parseFloat(previousOperand);
        const current = parseFloat(currentOperand);

        if (isNaN(prev) || isNaN(current)) return true;


        lastOperationForEquals = operation;
        lastOperandForEquals = currentOperand;

        lastFullEquation = `${getFormattedNumber(previousOperand)} ${operation} ${getFormattedNumber(currentOperand)} =`;
        unaryHistory = undefined;

        switch (operation) {
            case '+':
                computation = prev + current;
                break;
            case '−':
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    mainDisplay.innerText = 'Cannot divide by zero';
                    lastOperationForEquals = undefined; 
                    lastOperandForEquals = undefined;
                    readyToReset = true; 
                    return false; 
                }
                computation = prev / current;
                break;
            default:
                return true; 
        }

        const resultString = computation.toString();

        calculationHistory.push({
            equation: lastFullEquation,
            result: resultString
        });
        updateHistoryDisplay();

        currentOperand = resultString;
        operation = undefined;
        previousOperand = '';
        readyToReset = true; 
        return true; 
    }

    // --- 5. HÀM CHỌN PHÉP TOÁN ---
    function chooseOperation(op) {
        lastFullEquation = undefined;
        lastOperationForEquals = undefined;
        lastOperandForEquals = undefined;
        readyToReset = false;

        if (currentOperand === '' && previousOperand === '') return;
        
        if (currentOperand === '' && previousOperand !== '') {
            operation = op;
            unaryHistory = undefined;
            return;
        }

        if (previousOperand !== '') {
            calculate();
            updateDisplay();
        }

        operation = op;
        previousOperand = currentOperand;
        currentOperand = '';
        unaryHistory = undefined;
    }

    // --- 6. HÀM THÊM SỐ VÀO MÀN HÌNH ---
    function appendNumber(number) {
        if (readyToReset) {
            currentOperand = '';
            readyToReset = false;
            lastFullEquation = undefined;
            unaryHistory = undefined;
            lastOperationForEquals = undefined;
            lastOperandForEquals = undefined;
        }

        if (currentOperand === '' && operation != null) {
            currentOperand = number;
            unaryHistory = undefined;
            return; 
        }

        if (currentOperand === '0' && number === '0') return;
        if (currentOperand === '0' && number !== '0' && !currentOperand.includes('.')) {
            currentOperand = number;
            return;
        }
        
        if (currentOperand.length > 15) return;

        currentOperand = currentOperand.toString() + number.toString();
    }
    
    // --- 7. CÁC HÀM XỬ LÝ NÚT KHÁC ---
    
    function clearAll() {
        currentOperand = '0';
        previousOperand = '';
        operation = undefined;
        readyToReset = false;
        lastFullEquation = undefined;
        unaryHistory = undefined;
        lastOperationForEquals = undefined;
        lastOperandForEquals = undefined;
    }

    function clearEntry() {
        currentOperand = '0';
        readyToReset = false;
        unaryHistory = undefined;
    }
    
    function backspace() {
        if (readyToReset) {
            clearAll();
            updateDisplay();
            return;
        }
        currentOperand = currentOperand.toString().slice(0, -1);
        unaryHistory = undefined;
        lastOperationForEquals = undefined;
        lastOperandForEquals = undefined;
        
        if (currentOperand === '') {
            currentOperand = '0';
        }
    }
    
    function addDecimal() {
        if (readyToReset) {
            currentOperand = '0';
            readyToReset = false;
            lastFullEquation = undefined;
            unaryHistory = undefined;
            lastOperationForEquals = undefined;
            lastOperandForEquals = undefined;
        }
        
        if (currentOperand === '' && operation != null) {
            currentOperand = '0.';
            unaryHistory = undefined;
            return;
        }

        if (currentOperand.includes('.')) return;
        currentOperand = currentOperand + '.';
    }
    
    function negate() {
        if (currentOperand === '0') return;
        currentOperand = (parseFloat(currentOperand) * -1).toString();
        unaryHistory = undefined;
    }

    function handleUnaryOperation(op) {
        lastFullEquation = undefined;
        lastOperationForEquals = undefined;
        lastOperandForEquals = undefined;
        
        if (currentOperand === '' || currentOperand === '0') return true;
    
        const current = parseFloat(currentOperand);
        if (isNaN(current)) return true;
        let baseValue = unaryHistory ? unaryHistory : parseFloat(currentOperand).toString();
        let result;
        switch(op) {
            case '%':
                if (previousOperand !== '') {
                    result = parseFloat(previousOperand) * (current / 100);
                } else {
                    result = 0;
                }
                unaryHistory = undefined;
                break;
            case '¹/x':
                if (current === 0) {
                    mainDisplay.innerText = 'Cannot divide by zero';
                    readyToReset = true;
                    return false;
                }
                result = 1 / current;
                unaryHistory = `1/(${baseValue})`;
                break;
            case 'x²':
                result = current * current;
                unaryHistory = `sqr(${baseValue})`;
                break;
            case '√x':
                if (current < 0) {
                    mainDisplay.innerText = 'Invalid input';
                    readyToReset = true;
                    return false;
                }
                result = Math.sqrt(current);
                unaryHistory = `√(${baseValue})`;
                break;
            default:
                return true;
        }
        currentOperand = result.toString();
        readyToReset = true; 
        return true;
    }

    // --- 7.5. THÊM MỚI: CÁC HÀM XỬ LÝ BỘ NHỚ ---

    // MC - Memory Clear
    function memoryClear() {
        memoryHistory = [];
        updateMemoryDisplay();
    }

    // MR - Memory Recall
    function memoryRecall() {
        if (memoryHistory.length > 0) {
            // Lấy mục mới nhất (mục đầu tiên trong mảng)
            currentOperand = memoryHistory[0].toString();
            readyToReset = true;
            lastFullEquation = undefined;
            unaryHistory = undefined;
        }
    }

    // MS - Memory Store
    function memoryStore() {
        const current = parseFloat(currentOperand);
        if (isNaN(current)) return;
        
        // Thêm vào đầu danh sách (mục mới nhất)
        memoryHistory.unshift(current);
        
        // Giới hạn bộ nhớ (tùy chọn)
        if (memoryHistory.length > 100) {
            memoryHistory.pop();
        }
        
        readyToReset = true;
        updateMemoryDisplay();
    }

    // M+ - Memory Add
    function memoryAdd() {
        const current = parseFloat(currentOperand);
        if (isNaN(current)) return;

        if (memoryHistory.length === 0) {
            // Nếu chưa có gì, hoạt động như MS
            memoryHistory.unshift(current);
        } else {
            // Cộng vào mục đầu tiên (mới nhất)
            memoryHistory[0] = memoryHistory[0] + current;
        }
        readyToReset = true;
        updateMemoryDisplay();
    }

    // M- - Memory Subtract
    function memorySubtract() {
        const current = parseFloat(currentOperand);
        if (isNaN(current)) return;

        if (memoryHistory.length === 0) {
            // Nếu chưa có gì, lưu giá trị âm
            memoryHistory.unshift(-current);
        } else {
            // Trừ khỏi mục đầu tiên (mới nhất)
            memoryHistory[0] = memoryHistory[0] - current;
        }
        readyToReset = true;
        updateMemoryDisplay();
    }

    // --- 8. BỘ LẮNG NGHE SỰ KIỆN (EVENT LISTENER) ---
    buttonGrid.addEventListener('click', (e) => {
        if (!e.target.matches('button')) return;

        const button = e.target;
        const action = button.innerText;
        
        let shouldUpdateDisplay = false;

        if (/\d/.test(action)) {
            appendNumber(action);
            shouldUpdateDisplay = true;
        } else if (action === '.') {
            addDecimal();
            shouldUpdateDisplay = true;
        } else if (action === '=') {
            shouldUpdateDisplay = calculate();
        } else if (action === 'C') {
            clearAll();
            shouldUpdateDisplay = true; 
        } else if (action === 'CE') {
            clearEntry();
            shouldUpdateDisplay = true;
        } else if (action === '⌫') {
            backspace();
            shouldUpdateDisplay = true;
        } else if (action === '+/-') {
            negate();
            shouldUpdateDisplay = true;
        } else if (['+', '−', '-', '×', '÷'].includes(action)) {
            chooseOperation(action);
            shouldUpdateDisplay = true; 
        } else if (['%', '¹/x', 'x²', '√x'].includes(action)) {
            shouldUpdateDisplay = handleUnaryOperation(action);
        } else if (action === 'MC') {
            memoryClear();
            shouldUpdateDisplay = false; 
        } else if (action === 'MR') {
            memoryRecall();
            shouldUpdateDisplay = true; 
        } else if (action === 'MS') {
            memoryStore();
            shouldUpdateDisplay = false;
        } else if (action === 'M+') {
            memoryAdd();
            shouldUpdateDisplay = false; 
        } else if (action === 'M-') {
            memorySubtract();
            shouldUpdateDisplay = false; 
        }
        
        if (shouldUpdateDisplay) {
            updateDisplay();
        }
    });

    // --- 9. BỘ LẮNG NGHE SỰ KIỆN BÀN PHÍM ---
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        if (/^F(?:[1-9]|1[0-2])$/i.test(key)) { return; }
        if (e.ctrlKey && (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'H')) {
            e.preventDefault(); 
            
            if (window.innerWidth >= 1024) {
                historyPanel.classList.toggle('hidden');
            } else {
                const isHidden = historyPanel.classList.contains('hidden') || historyPanel.classList.contains('translate-y-full');
                if (isHidden) {
                    showMobileHistory();
                } else {
                    hideMobileHistory();
                }
            }
            return;
        }
        
        // Phím tắt cho bộ nhớ (Ctrl+M, Ctrl+Q, Ctrl+P, Ctrl+L, Ctrl+R)
        if (e.ctrlKey) {
            e.preventDefault();
            switch(e.key.toLowerCase()) {
                case 'l': // Clear
                    memoryClear();
                    return;
                case 'r': // Recall
                    memoryRecall();
                    updateDisplay();
                    return;
                case 'm': // Store
                    memoryStore();
                    return;
                case 'p': // Add
                    memoryAdd();
                    return;
                case 'q': // Subtract
                    memorySubtract();
                    return;
            }
        }


        let shouldUpdateDisplay = false;

        if (/\d/.test(key)) {
            appendNumber(key);
            shouldUpdateDisplay = true;
        } else if (key === '.') {
            addDecimal();
            shouldUpdateDisplay = true; 
        } else if (key === '=' || key === 'Enter') {
            shouldUpdateDisplay = calculate(); // Giữ nguyên, vì calculate() tự trả về true/false
        } else if (key === 'Escape') { 
            clearAll();
            shouldUpdateDisplay = true; 
        } else if (key.toLowerCase() === 'c') {
            clearEntry();
            shouldUpdateDisplay = true; 
        } else if (key === 'Backspace') {
            backspace();
            shouldUpdateDisplay = true; 
        } else if (key === '+') {
            chooseOperation('+');
            shouldUpdateDisplay = true; 
        } else if (key === '-') {
            chooseOperation('−');
            shouldUpdateDisplay = true; 
        } else if (key === '*') {
            chooseOperation('×');
            shouldUpdateDisplay = true; 
        } else if (key === '/') {
            e.preventDefault();
            chooseOperation('÷');
            shouldUpdateDisplay = true;
        } else if (key === '%') {
            shouldUpdateDisplay = handleUnaryOperation('%'); 
        } else if (key === '@') {
            shouldUpdateDisplay = handleUnaryOperation('√x'); 
        } else if (key.toLowerCase() === 'q' && !e.ctrlKey) { 
            shouldUpdateDisplay = handleUnaryOperation('x²'); 
        } else if (key.toLowerCase() === 'r' && !e.ctrlKey) { 
            shouldUpdateDisplay = handleUnaryOperation('¹/x');
        }
        
        if (shouldUpdateDisplay) {
            updateDisplay();
        }
    });

    // --- 10. BỘ LẮNG NGHE CÁC NÚT LỊCH SỬ (VÀ CÁC HÀM HELPER MỚI) ---
    
    function showMobileHistory() {
        mobileHistoryOverlay.classList.remove('hidden');
        historyPanel.classList.remove('hidden');
        setTimeout(() => {
            historyPanel.classList.remove('translate-y-full');
        }, 20); 
    }

    function hideMobileHistory() {
        historyPanel.classList.add('translate-y-full');
        setTimeout(() => {
            mobileHistoryOverlay.classList.add('hidden');
            historyPanel.classList.add('hidden');
        }, 300);
    }

    historyToggle.addEventListener('click', () => {
        if (window.innerWidth >= 1024) {
            historyPanel.classList.toggle('hidden');
        } else {
            showMobileHistory();
            showHistoryTab(); // THAY ĐỔI: Thêm dòng này để đảm bảo tab Lịch sử được chọn
        }
    });

    // Listener cho nút M▾ (dropdown)
    btnMDropdown.addEventListener('click', () => {
        // Chỉ hoạt động trên di động (dưới lg) và khi nút không bị vô hiệu hóa
        if (window.innerWidth < 1024 && !btnMDropdown.disabled) {
            showMobileHistory();
            showMemoryTab(); 
        }
    });

    mobileHistoryOverlay.addEventListener('click', () => {
        hideMobileHistory();
    });

    clearHistoryButton.addEventListener('click', () => {
        calculationHistory = [];
        updateHistoryDisplay();
    });

    // --- 11. THÊM MỚI: BỘ LẮNG NGHE CHUYỂN TAB (HISTORY/MEMORY) ---

    function showHistoryTab() {
        // Nội dung
        historyContent.classList.remove('hidden');
        memoryContent.classList.add('hidden');
        
        // Nút Clear
        clearHistoryWrapper.classList.remove('hidden');
        clearMemoryWrapper.classList.add('hidden');

        // Kiểu tab
        tabHistory.classList.add('font-bold', 'border-b-2', 'border-blue-500');
        tabHistory.classList.remove('text-gray-600');
        tabMemory.classList.remove('font-bold', 'border-b-2', 'border-blue-500');
        tabMemory.classList.add('text-gray-600');
    }

    function showMemoryTab() {
        // Nội dung
        historyContent.classList.add('hidden');
        memoryContent.classList.remove('hidden');

        // Nút Clear
        clearHistoryWrapper.classList.add('hidden');
        clearMemoryWrapper.classList.remove('hidden');

        // Kiểu tab
        tabHistory.classList.remove('font-bold', 'border-b-2', 'border-blue-500');
        tabHistory.classList.add('text-gray-600');
        tabMemory.classList.add('font-bold', 'border-b-2', 'border-blue-500');
        tabMemory.classList.remove('text-gray-600');
        
        // Cập nhật hiển thị bộ nhớ khi chuyển qua
        updateMemoryDisplay();
    }

    tabHistory.addEventListener('click', showHistoryTab);
    tabMemory.addEventListener('click', showMemoryTab);

    // THÊM MỚI: Listener cho nút xóa bộ nhớ
    clearMemoryButton.addEventListener('click', () => {
        memoryClear(); // Hàm này đã gọi updateMemoryDisplay()
    });


    // --- 12. KHỞI CHẠY ---
    updateHistoryDisplay();
    updateMemoryDisplay(); 
    updateDisplay();
});