let deck = [];
let players = [[], []];
let playerNames = ["Player 1", "Player 2"];
let currentPlayer = 0;
let discard = null;
let wildPending = false;
let isDraw4 = false;

function startGame() {
    const n1 = document.getElementById('p1-name-input').value;
    const n2 = document.getElementById('p2-name-input').value;
    if(n1) playerNames[0] = n1;
    if(n2) playerNames[1] = n2;

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    init();
}

function init() {
    createDeck();
    shuffle(deck);
    for(let i=0; i<7; i++) {
        players[0].push(deck.pop());
        players[1].push(deck.pop());
    }
    discard = deck.pop();
    while(discard.color === 'black' || discard.value > 9) { 
        deck.push(discard); shuffle(deck); discard = deck.pop(); 
    }
    renderTable();
    prepareNextTurn(true); // Start with first player
}

function createDeck() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    deck = [];
    colors.forEach(c => {
        for(let i=0; i<=12; i++) {
            deck.push({ color: c, value: i, img: `${c}${i}.png` });
            if(i !== 0) deck.push({ color: c, value: i, img: `${c}${i}.png` });
        }
    });
    for(let i=0; i<4; i++) {
        deck.push({ color: 'black', value: 'wild', img: 'wild.jpg' });
        deck.push({ color: 'black', value: 'draw4', img: 'draw4.jpg' });
    }
}

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

function playCard(index) {
    if(wildPending) return;
    const card = players[currentPlayer][index];
    
    if (card.color === 'black' || card.color === discard.color || card.value === discard.value) {
        discard = players[currentPlayer].splice(index, 1)[0];
        
        if (discard.value === 'wild' || discard.value === 'draw4') {
            isDraw4 = (discard.value === 'draw4');
            wildPending = true;
            document.getElementById('wild-title').innerText = isDraw4 ? "DRAW 4: PICK COLOR" : "WILD: PICK COLOR";
            document.getElementById('wild-modal').classList.remove('hidden');
        } else {
            handleActionCards(discard);
        }
    }
}

function handleActionCards(card) {
    let nextPlayerHit = false;
    const otherPlayer = (currentPlayer === 0) ? 1 : 0;

    if (card.value === 10 || card.value === 11) {
        // Reverse or Skip: In 2p, you get another turn!
        alert(`${playerNames[currentPlayer]} played a ${card.value === 10 ? 'Reverse' : 'Skip'}! Go again!`);
        renderTable();
        showHand(); 
    } else if (card.value === 12) {
        // +2 Card
        players[otherPlayer].push(deck.pop(), deck.pop());
        alert(`${playerNames[otherPlayer]} draws 2 and skips a turn!`);
        checkWin(); // End current turn, but effectively skips the next
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
        alert(`${playerNames[otherPlayer]} draws 4 and skips a turn!`);
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

function checkWin() {
    if(players[currentPlayer].length === 0) {
        alert(`${playerNames[currentPlayer]} WINS!`);
        location.reload();
    } else {
        prepareNextTurn();
    }
}

function prepareNextTurn(isFirstTurn = false) {
    if(!isFirstTurn) currentPlayer = (currentPlayer === 0) ? 1 : 0;
    
    document.getElementById('hand').innerHTML = ''; 
    document.getElementById('next-player-name').innerText = `READY ${playerNames[currentPlayer].toUpperCase()}?`;
    document.getElementById('pass-screen').classList.remove('hidden');
    renderTable();
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}
