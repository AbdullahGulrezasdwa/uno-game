let deck = [];
let players = [[], []];
let playerNames = ["Player 1", "Player 2"];
let currentPlayer = 0;
let discard = null;
let wildPending = false;
let isDraw4 = false;

// 1. Initial Name Entry
function startGame() {
    const n1 = document.getElementById('p1-name-input').value;
    const n2 = document.getElementById('p2-name-input').value;
    if(n1) playerNames[0] = n1;
    if(n2) playerNames[1] = n2;

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    init();
}

// 2. Build the Deck
function createDeck() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    deck = [];
    colors.forEach(c => {
        for(let i=0; i<=12; i++) {
            // 0-9 = Numbers, 10 = Reverse, 11 = Skip, 12 = +2
            deck.push({ color: c, value: i, img: `${c}${i}.png` });
            if(i !== 0) deck.push({ color: c, value: i, img: `${c}${i}.png` });
        }
    });
    // Wilds (.jpg as requested)
    for(let i=0; i<4; i++) {
        deck.push({ color: 'black', value: 'wild', img: 'wild.jpg' });
        deck.push({ color: 'black', value: 'draw4', img: 'draw4.jpg' });
    }
}

function init() {
    createDeck();
    shuffle(deck);
    for(let i=0; i<7; i++) {
        players[0].push(deck.pop());
        players[1].push(deck.pop());
    }
    discard = deck.pop();
    // Ensure game doesn't start with a Wild or Special
    while(discard.color === 'black' || discard.value > 9) { 
        deck.push(discard); shuffle(deck); discard = deck.pop(); 
    }
    renderTable();
    prepareNextTurn(true); 
}

// 3. Game UI Updates
function renderTable() {
    document.getElementById('discard-pile').innerHTML = `<img src="images/${discard.img}" class="card shadow">`;
    document.getElementById('turn-display').innerText = playerNames[currentPlayer].toUpperCase();
}

function showHand() {
    document.getElementById('pass-screen').classList.add('hidden');
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';
    players[currentPlayer].forEach((card, i) => {
        const img = document.createElement('img');
        img.src = `images/${card.img}`;
        img.className = 'card shadow';
        img.onclick = () => playCard(i);
        handDiv.appendChild(img);
    });
}

// 4. Rule Enforcement
function playCard(index) {
    if(wildPending) return;
    const card = players[currentPlayer][index];
    
    if (card.color === 'black' || card.color === discard.color || card.value === discard.value) {
        discard = players[currentPlayer].splice(index, 1)[0];
        
        if (discard.color === 'black') {
            isDraw4 = (discard.img === 'draw4.jpg');
            wildPending = true;
            document.getElementById('wild-modal').classList.remove('hidden');
        } else {
            handleActionCards(discard);
        }
    }
}

function handleActionCards(card) {
    const otherPlayer = (currentPlayer === 0) ? 1 : 0;

    if (card.value === 10 || card.value === 11) {
        // Skip/Reverse Rule: You go again immediately!
        alert(`${playerNames[currentPlayer]} skips the opponent! Go again.`);
        renderTable();
        showHand(); 
    } else if (card.value === 12) {
        // +2 Rule
        players[otherPlayer].push(deck.pop(), deck.pop());
        alert(`${playerNames[otherPlayer]} draws 2! Turn skips back to you.`);
        // In 2p +2, you effectively go again
        renderTable();
        showHand();
    } else {
        checkWin();
    }
}

function pickWild(c) {
    discard.color = c;
    wildPending = false;
    document.getElementById('wild-modal').classList.add('hidden');
    
    if(isDraw4) {
        const otherPlayer = (currentPlayer === 0) ? 1 : 0;
        players[otherPlayer].push(deck.pop(), deck.pop(), deck.pop(), deck.pop());
        alert(`${playerNames[otherPlayer]} draws 4!`);
        isDraw4 = false;
    }
    checkWin();
}

function handleDraw() {
    const pHand = players[currentPlayer];
    const canPlay = pHand.some(c => c.color === 'black' || c.color === discard.color || c.value === discard.value);
    if(!canPlay) {
        pHand.push(deck.pop());
        showHand();
    }
}

function prepareNextTurn(isFirstTurn = false) {
    if(!isFirstTurn) currentPlayer = (currentPlayer === 0) ? 1 : 0;
    document.getElementById('hand').innerHTML = ''; 
    document.getElementById('next-player-name').innerText = `READY ${playerNames[currentPlayer].toUpperCase()}?`;
    document.getElementById('pass-screen').classList.remove('hidden');
    renderTable();
}

function checkWin() {
    if(players[currentPlayer].length === 0) {
        alert(`${playerNames[currentPlayer]} WINS!`);
        location.reload();
    } else {
        prepareNextTurn();
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}
