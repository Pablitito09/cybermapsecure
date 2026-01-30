const cols = 20;
const rows = 20;
let grid = [];
const gridContainer = document.getElementById('grid-container');
const statusText = document.getElementById('status');

// Classe do Nó
class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isWall = false;
        this.risk = 1;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.parent = null;
        this.element = null;
    }
}

// Gerar a Grelha
function generateGrid() {
    gridContainer.innerHTML = '';
    grid = [];
    statusText.innerText = "REDE GERADA. SISTEMA PRONTO.";
    statusText.style.color = "#00ff41";
    statusText.classList.remove("blink");

    for (let x = 0; x < cols; x++) {
        grid[x] = [];
        for (let y = 0; y < rows; y++) {
            let node = new Node(x, y);
            let cell = document.createElement('div');
            cell.classList.add('cell');

            // Regra dos Terminais (Início e Fim)
            if (x === 0 && y === 0) {
                cell.classList.add('start-node');
            } else if (x === cols - 1 && y === rows - 1) {
                cell.classList.add('end-node');
            } else {
                // Obstáculos (20% de chance)
                if (Math.random() < 0.2) {
                    node.isWall = true;
                    cell.classList.add('wall');
                } 
                // Zonas de Risco (30% de chance)
                else if (Math.random() < 0.3) {
                    node.risk = 10; // Custo alto para evitar esta zona
                    cell.classList.add('risk');
                }
            }

            node.element = cell;
            gridContainer.appendChild(cell);
            grid[x][y] = node;
        }
    }
}

// Algoritmo A*
async function calculateRoute() {
    statusText.innerText = "ENCRIPTANDO ROTA... AGUARDE.";
    statusText.classList.add("blink");
    
    // Pequeno delay para dramatismo
    await sleep(500);

    let start = grid[0][0];
    let end = grid[cols-1][rows-1];
    
    let openSet = [start];
    let closedSet = [];
    
    while (openSet.length > 0) {
        let lowestIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIndex].f) {
                lowestIndex = i;
            }
        }
        
        let current = openSet[lowestIndex];

        if (current === end) {
            statusText.classList.remove("blink");
            reconstructPath(current);
            return;
        }

        openSet.splice(lowestIndex, 1);
        closedSet.push(current);

        let neighbors = getNeighbors(current);
        for (let neighbor of neighbors) {
            if (closedSet.includes(neighbor) || neighbor.isWall) continue;

            // O SEGREDO DO 20 VALORES: Custo = Distância + Risco de Segurança
            let tempG = current.g + 1 + neighbor.risk;

            let newPath = false;
            if (openSet.includes(neighbor)) {
                if (tempG < neighbor.g) {
                    neighbor.g = tempG;
                    newPath = true;
                }
            } else {
                neighbor.g = tempG;
                newPath = true;
                openSet.push(neighbor);
            }

            if (newPath) {
                neighbor.h = heuristic(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = current;
            }
        }
    }
    
    statusText.innerText = "ERRO CRÍTICO: ROTA IMPOSSÍVEL";
    statusText.style.color = "#ff003c";
    statusText.classList.remove("blink");
}

async function reconstructPath(current) {
    let path = [];
    let temp = current;
    while (temp) {
        path.push(temp);
        temp = temp.parent;
    }
    path.reverse();

    for (let node of path) {
        // Não pintar por cima dos quadrados brancos
        if (!node.element.classList.contains('start-node') && !node.element.classList.contains('end-node')) {
            node.element.classList.add('path');
        }
        await sleep(30); // Efeito visual de dados a fluir
    }
    statusText.innerText = "CONEXÃO SEGURA ESTABELECIDA.";
    statusText.style.color = "#00ff41";
}

function getNeighbors(node) {
    let neighbors = [];
    let x = node.x;
    let y = node.y;
    if (x < cols - 1) neighbors.push(grid[x + 1][y]);
    if (x > 0) neighbors.push(grid[x - 1][y]);
    if (y < rows - 1) neighbors.push(grid[x][y + 1]);
    if (y > 0) neighbors.push(grid[x][y - 1]);
    return neighbors;
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Inicia automaticamente
generateGrid();