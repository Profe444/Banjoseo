// --- Variables Globales ---
const GRID_SIZE = 5; 
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE; // 25 casillas

let gameState = {
    isBetActive: false,
    minesCount: 3, 
    betAmount: 0,
    currentGrid: [], 
    gemsFound: 0,
    currentMultiplier: 1.00,
    winnings: 0,
    
    // --- VARIABLES DE AUTO-APUESTA ---
    isAutoBetting: false, 
    autoBetsRemaining: 0,
    autoTargetGems: 3, 
    autoBetTimer: null, 
};

// --- Variables de Audio 🔊 ---
const gemAudio = new Audio('sounds/gem_sound.mp3'); 
const mineAudio = new Audio('sounds/mine_sound.mp3');


// --- Elementos del DOM ---
let gridContainer, betButton, minesSelect, betAmountInput, totalWinElement;
// NUEVAS VARIABLES DE DOM PARA AUTO
let tabButtons, manualControls, automaticControls, autoBetButton, numBetsInput, autoMinesSelect, autoBetAmountInput, autoTargetGemsInput;


// --- Utilidades ---

function formatCurrency(amount) {
    if (isNaN(amount) || amount === null) {
        return (0).toFixed(8) + ' US$';
    }
    return amount.toFixed(8) + ' US$';
}

// --- Inicialización del Tablero ---

function createGrid() {
    if (!gridContainer) return; 

    gridContainer.innerHTML = ''; 
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i; 
        cell.addEventListener('click', handleCellClick);
        gridContainer.appendChild(cell);
    }
}

function setupGridContent(mines) {
    let grid = new Array(TOTAL_CELLS).fill('gem'); 
    
    for (let i = 0; i < mines; i++) {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * TOTAL_CELLS);
        } while (grid[randomIndex] === 'mine'); 
        grid[randomIndex] = 'mine';
    }
    gameState.currentGrid = grid;
}

// --- Manejo de la Apuesta (Manual & Auto) ---

function handleBet(isAuto = false) {
    // 1. Determinar de dónde tomar los valores
    const currentBetInput = isAuto ? autoBetAmountInput : betAmountInput;
    const currentMinesSelect = isAuto ? autoMinesSelect : minesSelect;

    if (gameState.isBetActive) {
        if (!isAuto) handleCashout();
        return;
    }

    // 1. Obtener y validar valores
    const inputValue = currentBetInput.value.replace(' US$', '').trim();
    const betValue = parseFloat(inputValue);
    const minesValue = parseInt(currentMinesSelect.value);

    if (betValue <= 0 || isNaN(betValue)) {
        if (!isAuto) alert("Por favor, ingrese un monto de apuesta válido (mayor que 0).");
        return false;
    }
    
    if (minesValue > TOTAL_CELLS - 1) { // No más de 24 minas
        if (!isAuto) alert("El número de minas es demasiado alto.");
        return false;
    }

    // 2. Reiniciar el estado del juego
    gameState.isBetActive = true;
    gameState.betAmount = betValue;
    gameState.minesCount = minesValue;
    gameState.gemsFound = 0;
    gameState.currentMultiplier = 1.00;
    gameState.winnings = betValue; 
    
    // 3. Configurar el tablero
    createGrid(); 
    setupGridContent(minesValue); 

    // 4. Actualizar la interfaz
    if (!isAuto) {
        betButton.textContent = `Cobrar (${gameState.currentMultiplier.toFixed(2)}x)`;
        betButton.classList.add('cashout');
    }
    totalWinElement.textContent = formatCurrency(gameState.winnings);
    
    return true; // Éxito al iniciar la apuesta
}

// --- Lógica del Juego (Clic en Casilla) ---

function handleCellClick(event) {
    // Evitar clics manuales si la auto-apuesta está activa
    if (gameState.isAutoBetting && event.isTrusted) {
        console.log("Clic manual ignorado. Auto-apuesta en curso.");
        return;
    }

    if (!gameState.isBetActive) {
        if (!gameState.isAutoBetting) alert("Debes realizar una apuesta antes de hacer clic en las casillas.");
        return;
    }

    const cell = event.currentTarget;
    const index = parseInt(cell.dataset.index);

    if (cell.classList.contains('revealed')) {
        return;
    }

    const content = gameState.currentGrid[index];
    cell.classList.add('revealed');

    if (content === 'mine') {
        // MINA: ¡Juego Terminado!
        mineAudio.currentTime = 0;
        mineAudio.play().catch(e => console.error("Error al reproducir mina:", e));
        
        cell.classList.add('mine');
        cell.textContent = '💣';
        gameState.winnings = 0; 
        endGame(false); 
        
        // Si estaba en Auto, pasa al siguiente ciclo después de perder
        if (gameState.isAutoBetting) {
            setTimeout(startAutoBetCycle, 1500); 
        }

    } else {
        // GEMA: ¡Continuar!
        gemAudio.currentTime = 0;
        gemAudio.play().catch(e => console.error("Error al reproducir gema:", e));
        
        cell.classList.add('gem-found');
        cell.textContent = '💎';
        gameState.gemsFound++;
        
        // CÁLCULO DEL MULTIPLICADOR
        const cellsRemaining = TOTAL_CELLS - gameState.gemsFound;
        const totalGems = TOTAL_CELLS - gameState.minesCount;
        const gemsRemaining = totalGems - gameState.gemsFound;
        
        if (gemsRemaining > 0) {
            const nextStepMultiplier = cellsRemaining / gemsRemaining;
            gameState.currentMultiplier *= nextStepMultiplier; 
        }

        // Actualizar ganancias y botón
        gameState.winnings = gameState.betAmount * gameState.currentMultiplier;
        betButton.textContent = `Cobrar (${gameState.currentMultiplier.toFixed(2)}x)`;
        totalWinElement.textContent = formatCurrency(gameState.winnings);
        
        // 🚨 Lógica de COBRO AUTOMÁTICO
        if (gameState.isAutoBetting && gameState.gemsFound >= gameState.autoTargetGems) {
             console.log("Objetivo de gemas alcanzado. Cobrando automáticamente.");
             handleCashout(true); 
        } else if (gemsRemaining === 0) {
             endGame(true, gameState.winnings);
             if (gameState.isAutoBetting) {
                setTimeout(startAutoBetCycle, 1500); 
             }
        }
    }
}

// --- Cobrar y Finalizar el Juego ---

function handleCashout(isAuto = false) {
    if (!gameState.isBetActive || gameState.gemsFound === 0) {
        return;
    }
    
    const finalWin = gameState.winnings;
    if (!isAuto) {
        alert(`¡Has cobrado! Ganancia total: ${formatCurrency(finalWin)}`);
    }
    endGame(true, finalWin); 
    
    if (isAuto) {
        // Si es cobro automático, pasar al siguiente ciclo
        setTimeout(startAutoBetCycle, 500); 
    }
}

function endGame(didWin, finalWin = 0) {
    gameState.isBetActive = false;
    
    document.querySelectorAll('.cell:not(.revealed)').forEach(cell => {
        const index = parseInt(cell.dataset.index);
        const content = gameState.currentGrid[index];
        cell.classList.add('revealed');
        cell.removeEventListener('click', handleCellClick);
        
        if (content === 'mine') {
            cell.classList.add('mine-revealed');
            cell.textContent = '💣';
        } else {
            cell.classList.add('gem-revealed');
            cell.textContent = '🔹'; 
        }
    });

    betButton.textContent = 'Apuesta';
    betButton.classList.remove('cashout');
    
    if (didWin) {
        totalWinElement.textContent = formatCurrency(finalWin);
    } else {
        totalWinElement.textContent = formatCurrency(0);
    }
}

// ------------------------------------------
// --- LÓGICA DE AUTO-APUESTA ---
// ------------------------------------------

function startAutoBetCycle() {
    if (!gameState.isAutoBetting || gameState.autoBetsRemaining === 0) {
        stopAutoBet();
        return;
    }
    
    // 1. Iniciar la apuesta 
    const betSuccessful = handleBet(true); 
    
    if (!betSuccessful) {
        stopAutoBet();
        return;
    }

    // 2. Disminuir contador de apuestas (si no es infinito)
    if (gameState.autoBetsRemaining !== Infinity) {
        gameState.autoBetsRemaining--;
    }
    
    // 3. Ejecutar la secuencia de clics
    const clickInterval = 500; // Retraso entre clics
    let clicks = 0;

    gameState.autoBetTimer = setInterval(() => {
        // Condición de parada dentro del ciclo de clics
        if (!gameState.isBetActive || gameState.gemsFound >= gameState.autoTargetGems) {
            clearInterval(gameState.autoBetTimer);
            return;
        }

        // Simular el clic en una casilla aleatoria
        const availableCells = Array.from(document.querySelectorAll('.cell:not(.revealed)'));
        
        if (availableCells.length > 0) {
            const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
            
            // Simular el evento de clic (isTrusted: false para el código)
            handleCellClick({ currentTarget: randomCell, isTrusted: false }); 
            clicks++;
        }
        
    }, clickInterval);
}


function handleAutoBetButton() {
    if (gameState.isAutoBetting) {
        stopAutoBet();
        return;
    }
    
    // 1. Validar y configurar el estado
    const betAmount = parseFloat(autoBetAmountInput.value);
    const minesCount = parseInt(autoMinesSelect.value);
    const numBets = parseInt(numBetsInput.value);
    const targetGems = parseInt(autoTargetGemsInput.value);
    const maxGems = TOTAL_CELLS - minesCount;

    if (betAmount <= 0 || isNaN(betAmount) || targetGems <= 0 || targetGems > maxGems) {
        alert("Configuración de auto-apuesta inválida. Verifique monto y objetivo de gemas (máximo " + maxGems + ").");
        return;
    }
    
    // 2. Establecer el estado de auto-apuesta
    gameState.isAutoBetting = true;
    gameState.autoBetsRemaining = (numBets === 0) ? Infinity : numBets; 
    gameState.autoTargetGems = targetGems;

    autoBetButton.textContent = 'Detener Auto-apuesta';
    
    // 3. Comenzar el ciclo
    startAutoBetCycle();
}

function stopAutoBet() {
    gameState.isAutoBetting = false;
    clearInterval(gameState.autoBetTimer); 
    autoBetButton.textContent = 'Empezar Auto-apuesta';
    console.log("Auto-apuesta detenida.");
}

// ------------------------------------------
// --- LÓGICA DE PESTAÑAS (TABS) ---
// ------------------------------------------

function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            
            // 1. Desactivar todos los botones y activar el seleccionado
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 2. Mostrar/Ocultar los paneles (Efecto STAKE)
            if (mode === 'manual') {
                manualControls.classList.remove('hidden');
                automaticControls.classList.add('hidden');
                stopAutoBet(); // Detener el ciclo si cambiamos a manual
            } else {
                manualControls.classList.add('hidden');
                automaticControls.classList.remove('hidden');
            }
        });
    });
}


// --- INICIALIZACIÓN CRÍTICA ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. ASIGNACIÓN DE ELEMENTOS GENERALES
    gridContainer = document.querySelector('.grid-container');
    betButton = document.querySelector('.bet-button');
    minesSelect = document.getElementById('mines');
    betAmountInput = document.getElementById('bet-amount');
    totalWinElement = document.querySelector('.total-win');
    
    // 2. ASIGNACIÓN DE ELEMENTOS AUTO (Añadidos para el funcionamiento)
    tabButtons = document.querySelectorAll('.tab-button');
    manualControls = document.querySelector('.manual-controls');
    automaticControls = document.querySelector('.automatic-controls');
    autoBetButton = document.querySelector('.auto-bet-button');
    numBetsInput = document.getElementById('num-bets');
    autoMinesSelect = document.getElementById('auto-mines');
    autoBetAmountInput = document.getElementById('auto-bet-amount');
    autoTargetGemsInput = document.getElementById('auto-target-gems');
    
    // 3. ASIGNACIÓN DE EVENTOS
    if (betButton) {
        betButton.addEventListener('click', () => handleBet(false));
    }
    if (autoBetButton) {
        autoBetButton.addEventListener('click', handleAutoBetButton);
    }
    
    // 4. CONFIGURACIÓN DE PESTAÑAS
    setupTabs();
    
    // 5. CONFIGURACIÓN INICIAL DE VISIBILIDAD (Importante para el inicio)
    // Asume que al cargar, el modo manual está activo y el automático está oculto.
    manualControls.classList.remove('hidden');
    automaticControls.classList.add('hidden');
    
    // 6. INICIO DEL JUEGO
    createGrid(); 
    betAmountInput.value = (0).toFixed(8);
});