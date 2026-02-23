const cols = 20; const rows = 20;
let grid = [];
const gridContainer = document.getElementById('grid-container');
const statusText = document.getElementById('status');
const statusBox = document.querySelector('.status-box');

// Referências aos botões principais
const btnML = document.getElementById('btn-ml');
const btnTransmit = document.getElementById('btn-transmit');

class Node {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.isWall = false;
        this.risk = 1; 
        this.predicted = false; 
        this.f = 0; this.g = 0; this.h = 0;
        this.parent = null;
        this.element = null;
    }
}

// NOVO: Função para abrir e fechar as descrições dos botões
function toggleInfo(infoId, buttonElement) {
    const infoPanel = document.getElementById(infoId);
    if (infoPanel.style.display === "block") {
        infoPanel.style.display = "none";
        buttonElement.classList.remove("active");
    } else {
        infoPanel.style.display = "block";
        buttonElement.classList.add("active");
    }
}

function generateGrid() {
    gridContainer.innerHTML = ''; grid = [];
    statusBox.style.borderLeftColor = "#00ff41";
    statusText.innerText = "DATASET GERADO. PRONTO PARA SCAN.";
    statusText.style.color = "#00ff41"; statusText.classList.remove("blink");

    // Liberta o botão 2 e bloqueia o botão 3 até correr o modelo
    btnML.disabled = false;
    btnTransmit.disabled = true;

    // Garante 85% de probabilidade de ter um caminho verde até ao fim
    let safePath = new Set();
    let guaranteeSafePath = Math.random() < 0.85; 

    if (guaranteeSafePath) {
        let cx = 0, cy = 0;
        safePath.add(`${cx},${cy}`);
        while (cx < cols - 1 || cy < rows - 1) {
            if (cx === cols - 1) cy++;
            else if (cy === rows - 1) cx++;
            else { if (Math.random() < 0.5) cx++; else cy++; }
            safePath.add(`${cx},${cy}`);
        }
    }

    for (let x = 0; x < cols; x++) {
        grid[x] = [];
        for (let y = 0; y < rows; y++) {
            let node = new Node(x, y);
            let cell = document.createElement('div');
            cell.classList.add('cell');

            if (x === 0 && y === 0) { 
                cell.classList.add('start-node'); node.risk = 0; 
            } else if (x === cols - 1 && y === rows - 1) { 
                cell.classList.add('end-node'); node.risk = 0; 
            } else if (!safePath.has(`${x},${y}`)) {
                // AUMENTEI A QUANTIDADE: Paredes a 25% e Vírus a 22%
                if (Math.random() < 0.25) { node.isWall = true; cell.classList.add('wall'); } 
                else if (Math.random() < 0.22) { node.risk = 100; cell.classList.add('risk'); }
            }
            node.element = cell; gridContainer.appendChild(cell); grid[x][y] = node;
        }
    }
}

async function activatePredictiveML() {
    statusBox.style.borderLeftColor = "#b800ff";
    statusText.innerText = "TREINANDO MODELO ML... PREVENDO AMEAÇAS.";
    statusText.style.color = "#b800ff"; statusText.classList.add("blink");

    btnML.disabled = true; // Desativa para não clicar 2 vezes

    await sleep(500); 

    let threatsFound = 0;
    
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let node = grid[x][y];
            if (!node.isWall && node.risk === 1 && !(x===0&&y===0) && !(x===cols-1&&y===rows-1)) {
                let riskScore = calculateSurroundingRisk(x, y);
                if (riskScore > 1) {
                    node.predicted = true;
                    node.risk = 50; 
                    node.element.classList.add('predicted');
                    threatsFound++;
                    await sleep(10); 
                }
            }
        }
    }
    
    statusText.innerText = `MODELO CONCLUÍDO: ${threatsFound} AMEAÇAS PREVISTAS.`;
    statusText.classList.remove("blink");
    
    // Liberta o botão 3 para calcular a rota
    btnTransmit.disabled = false;
}

function calculateSurroundingRisk(x, y) {
    let score = 0;
    if (x < cols - 1 && grid[x+1][y].risk === 100) score++;
    if (x > 0 && grid[x-1][y].risk === 100) score++;
    if (y < rows - 1 && grid[x][y+1].risk === 100) score++;
    if (y > 0 && grid[x][y-1].risk === 100) score++;
    return score;
}

async function calculateRoute() {
    statusBox.style.borderLeftColor = "#00ff41";
    statusText.innerText = "CALCULANDO ROTA ÓTIMA...";
    statusText.style.color = "#00ff41"; statusText.classList.add("blink");

    btnTransmit.disabled = true;
    
    let start = grid[0][0]; let end = grid[cols-1][rows-1];
    let openSet = [start]; let closedSet = [];
    
    while (openSet.length > 0) {
        let lowestIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIndex].f) lowestIndex = i;
        }
        
        let current = openSet[lowestIndex];
        if (current === end) {
            statusText.classList.remove("blink");
            reconstructPath(current); return;
        }

        openSet.splice(lowestIndex, 1); closedSet.push(current);

        let neighbors = getNeighbors(current);
        for (let neighbor of neighbors) {
            if (closedSet.includes(neighbor) || neighbor.isWall) continue;

            let tempG = current.g + 1 + neighbor.risk;

            let newPath = false;
            if (openSet.includes(neighbor)) {
                if (tempG < neighbor.g) { neighbor.g = tempG; newPath = true; }
            } else {
                neighbor.g = tempG; newPath = true; openSet.push(neighbor);
            }

            if (newPath) {
                neighbor.h = heuristic(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = current;
            }
        }
    }
    statusText.innerText = "FALHA: SISTEMA TOTALMENTE COMPROMETIDO";
    statusText.style.color = "#ff003c"; statusText.classList.remove("blink");
}

async function reconstructPath(current) {
    let path = []; let temp = current; let maxRiskTaken = 0;
    while (temp) { path.push(temp); if (temp.risk > maxRiskTaken) maxRiskTaken = temp.risk; temp = temp.parent; }
    path.reverse();

    for (let node of path) {
        if (node.isWall) continue;
        if (!node.element.classList.contains('start-node') && !node.element.classList.contains('end-node')) {
            node.element.classList.remove('risk', 'predicted');
            if (node.risk === 100) {
                node.element.style.backgroundColor = "#ff9d00"; 
            } else if (node.risk === 50) {
                node.element.style.backgroundColor = "#b800ff"; 
            } else {
                node.element.classList.add('path'); 
            }
        }
        await sleep(30);
    }

    if (maxRiskTaken === 100) {
        statusBox.style.borderLeftColor = "#ff9d00";
        statusText.innerText = "ALERTA: ROTA DE CONTINGÊNCIA USADA";
        statusText.style.color = "#ff9d00"; statusText.classList.add("blink");
    } else if (maxRiskTaken === 50) {
        statusBox.style.borderLeftColor = "#b800ff";
        statusText.innerText = "AVISO: ROTA PASSOU POR ZONA PREVISTA (ML)";
        statusText.style.color = "#b800ff"; 
    } else {
        statusBox.style.borderLeftColor = "#00ff41";
        statusText.innerText = "CONEXÃO 100% SEGURA ESTABELECIDA.";
        statusText.style.color = "#00ff41";
    }
}

function getNeighbors(node) {
    let n = []; let x = node.x; let y = node.y;
    if (x < cols - 1) n.push(grid[x + 1][y]); if (x > 0) n.push(grid[x - 1][y]);
    if (y < rows - 1) n.push(grid[x][y + 1]); if (y > 0) n.push(grid[x][y - 1]);
    return n;
}
function heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

generateGrid();