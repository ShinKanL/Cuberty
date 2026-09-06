const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");
const clearButton = document.getElementById("clear-button");
const display = document.getElementById("timer-display");
const status = document.getElementById("timer-status");
const timesList = document.getElementById("times-list");
const averageTime = document.getElementById("average-time");
const bestTime = document.getElementById("best-time");
const worstTime = document.getElementById("worst-time");

const inspectionDuration = 15;
const storageKey = "cuberty-times";
let times = readTimes();
let countdownInterval;
let timerFrame;
let startedAt;
let mode = "ready";

function readTimes() {
    try {
        const savedTimes = JSON.parse(localStorage.getItem(storageKey));
        return Array.isArray(savedTimes) ? savedTimes.filter(time => Number.isFinite(time)) : [];
    } catch (error) {
        return [];
    }
}

function formatTime(milliseconds) {
    const centiseconds = Math.floor(milliseconds / 10);
    const minutes = Math.floor(centiseconds / 6000);
    const seconds = Math.floor((centiseconds % 6000) / 100);
    const decimals = centiseconds % 100;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(decimals).padStart(2, "0")}`;
}

function updateDisplay(milliseconds) {
    display.textContent = formatTime(Math.max(0, milliseconds));
}

function renderTimes() {
    if (!times.length) {
        timesList.innerHTML = '<li class="empty-times">Tus tiempos aparecerán aquí.</li>';
        averageTime.textContent = bestTime.textContent = worstTime.textContent = "--";
        return;
    }

    timesList.innerHTML = times.map((time, index) =>
        `<li><span>${index + 1}</span><strong>${formatTime(time)}</strong></li>`
    ).join("");

    const total = times.reduce((sum, time) => sum + time, 0);
    averageTime.textContent = formatTime(total / times.length);
    bestTime.textContent = formatTime(Math.min(...times));
    worstTime.textContent = formatTime(Math.max(...times));
}

function saveTimes() {
    localStorage.setItem(storageKey, JSON.stringify(times));
}

function startInspection() {
    mode = "inspection";
    let remaining = inspectionDuration;
    display.textContent = `00:${String(remaining).padStart(2, "0")}.00`;
    status.textContent = "Inspección";
    startButton.textContent = "Interrumpir";
    countdownInterval = setInterval(() => {
        remaining -= 1;
        display.textContent = `00:${String(Math.max(remaining, 0)).padStart(2, "0")}.00`;
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            startSolving();
        }
    }, 1000);
}

function startSolving() {
    mode = "solving";
    startedAt = performance.now();
    status.textContent = "Tiempo corriendo";
    startButton.textContent = "Detener";
    timerFrame = requestAnimationFrame(updateSolvingTime);
}

function updateSolvingTime(now) {
    updateDisplay(now - startedAt);
    timerFrame = requestAnimationFrame(updateSolvingTime);
}

function stopTimer() {
    if (mode === "inspection") {
        clearInterval(countdownInterval);
        mode = "ready";
        status.textContent = "Inspección interrumpida";
        display.textContent = "00:15.00";
        startButton.textContent = "Iniciar";
        return;
    }

    if (mode === "solving") {
        cancelAnimationFrame(timerFrame);
        const result = performance.now() - startedAt;
        times.unshift(result);
        saveTimes();
        renderTimes();
        mode = "ready";
        status.textContent = "Tiempo registrado";
        updateDisplay(result);
        startButton.textContent = "Iniciar";
    }
}

function resetTimer() {
    clearInterval(countdownInterval);
    cancelAnimationFrame(timerFrame);
    mode = "ready";
    status.textContent = "Listo para empezar";
    startButton.textContent = "Iniciar";
    updateDisplay(inspectionDuration * 1000);
}

startButton.addEventListener("click", () => {
    if (mode === "ready") {
        startInspection();
    } else {
        stopTimer();
    }
});

resetButton.addEventListener("click", resetTimer);

clearButton.addEventListener("click", () => {
    times = [];
    saveTimes();
    renderTimes();
});

document.addEventListener("keydown", event => {
    if (event.code !== "Space" || event.target.matches("button, a")) {
        return;
    }
    event.preventDefault();
    startButton.click();
});

renderTimes();
