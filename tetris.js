// récupère le canvas et son image en 2D
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

//echelle pour agrandir les pixels
context.scale(20,20);

//fonction pour supprimer les lignes complètes
function arenaSweep() {
    //parcourir les lignes de bas en haut
    let rowCount = 1;

    outer: for (let y = arena.length - 1; y > 0; --y){
        for (let x = 0; x < arena[y].length; ++x){
            if (arena[y][x] === 0){
                continue outer;
            }
        }
        //supprime la ligne complète et insère une nouvelle ligne vide en haut
        const row = arena.splice(y,1)[0].fill(0);
        arena.unshift(row);
        ++y; // vérifie après suppression

        //augmente le score basé sur les lignes supprimées
        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

//vérifie si le joueur entre en collision avec l'arèene
function collide(arena, player){
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y){
        for (let x = 0; x < m[y].length; ++x){
            if (
                m[y][x] !== 0 && // vérifie si la cellule du bloc n'est pas vide
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !==0 //vérifie si elle entre en collision avec l'arène
            ) {
                return true;
            }
        }
    }
    return false;
}

//créé une matrice vide
function createMatrix(w,h){
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0)); //remplit chaque ligne avec des zéros
    }
    return matrix;
}

// crée une matrice représentant les pièces en fonction de son type
function createPiece(type) {
    if (type === 'I'){
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L'){
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J'){
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O'){
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z'){
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S'){
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T'){
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    } 
}

// Dessine l'arène et le joueur
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value]; //couleur basé sur la valeur
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}
    

// dessine l'arène et le joueur
function draw() {
    context.fillStyle = '#000'; //fond noir
    context.fillRect(0, 0, canvas.clientWidth, canvas.height);

    drawMatrix(arena, {x: 0, y:0}); //dessine l'arène
    drawMatrix(player.matrix, player.pos); //dessine le joueur
}

//fusionne la pièce du joueur avec l'arène lorsqu'elle atteint une limite
function merge(arena,player){
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !==0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

//gère la rotation des pièces dans la matrice
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse()); //sens horaire
    } else {
        matrix.reverse(); // sens antihoraire
    }
}

//déplace le joueur vers le bas, fusionne la pièce si elle atteint une limite
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

// déplace horizontalement la pièce du joueur
function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

//rénitialise la pièce du joueur lorsqu'une pièce atteint une limite
function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0)); //rénitialise l'arène
        player.score = 0;
        updateScore();
    }
}

//fait tourner la pièce du joueur
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}


//initialise les variables globales
let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

//Boucle principale
function update(time = 0) {
    const deltaTime = time - lastTime;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    lastTime = time;

    draw();
    requestAnimationFrame(update); // appelle la fonction à chaque rafraichissement
}

//met à jour le score affiché
function updateScore() {
    document.getElementById('score').innerText = player.score;
}

//ecouteur pour les touches (pour jouer)
document.addEventListener('keydown', event => {
    if (event.keyCode === 37) { // flèche G
        playerMove(-1);
    } else if (event.keyCode === 39) {// flèche D
        playerMove(1);
    } else if (event.keyCode === 40) {// flèche B
        playerDrop();
    } else if (event.keyCode === 32) {// ESPACE pour rotation antihoraire
        playerRotate(-1);
    } else if (event.keyCode === 87) {// W pour rotation antihoraire
        playerRotate(1);
    } 
});

// Définition des couleurs des pièces
const colors = [
    null,
    '#FF0D0D',
    '#110DFF',
    '#00B530',
    '#8C0094',
    '#FF9D00',
    '#38FFDB',
    '#38FCFF',
];

// créé une arène de 12x20
const arena = createMatrix(12,20);

//initialise le joueur
const player = {
    pos: {x: 0, y:0},
    matrix: null,
    score: 0,
};

// lancement du jeu
playerReset();
updateScore();
update();