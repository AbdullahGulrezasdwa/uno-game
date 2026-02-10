let deck = [];
let players = [[], []];
let currentPlayer = 0;
let discard = null;
let wildPending = false;

function init() {
    createDeck();
    shuffle(deck);
    for(let i=0; i<7; i++) {
        players[0].push(deck.pop());
        players[1].push(deck.pop());
    }
    discard = deck.pop();
    // Prevent starting with a special card
    while(discard.color === 'black' || discard.value > 9) { 
        deck.push(discard); 
        shuffle(deck); 
        discard = deck.pop(); 
    }
    renderTable();
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

function renderTable() {
    document.getElementById('discard-pile').innerHTML = `<img src="images/${discard.img}" class="card shadow">`;
    document.getElementById('turn-display').innerText = `PLAYER ${currentPlayer + 1}`;
}

function playCard(index) {
    if(wildPending) return;
    const card = players[currentPlayer][index];
    if (card.color === 'black' || card.color === discard.color || card.value === discard.value) {
        discard = players[currentPlayer].splice(index, 1)[0];
        if (discard.color === 'black') {
            wildPending = true;
            document.getElementById('wild-modal').classList.remove('hidden');
        } else {
            handleSpecials(discard);
            checkWin();
        }
    }
}

function handleDraw() {
    const pHand = players[currentPlayer];
    const canPlay = pHand.some(c => c.color === 'black' || c.color === discard.color || c.value === discard.value);
    if(!canPlay) {
        pHand.push(deck.pop());
        showHand();
    } else {
        document.getElementById('msg').innerText = "You have a playable card!";
        setTimeout(() => document.getElementById('msg').innerText = "Match Color or Number!", 2000);
    }
}

function checkWin() {
    if(players[currentPlayer].length === 0) {
        alert(`PLAYER ${currentPlayer + 1} WINS!`);
        location.reload();
    } else {
        prepareNextTurn();
    }
}

function pickWild(c) {
    discard.color = c;
    wildPending = false;
    document.getElementById('wild-modal').classList.add('hidden');
    checkWin();
}

function prepareNextTurn() {
    currentPlayer = (currentPlayer === 0) ? 1 : 0;
    document.getElementById('hand').innerHTML = ''; 
    document.getElementById('next-player-name').innerText = `READY PLAYER ${currentPlayer + 1}?`;
    document.getElementById('pass-screen').classList.remove('hidden');
    renderTable();
}

function handleSpecials(card) {
    if(card.value === 12) { // +2 logic
        const target = (currentPlayer === 0) ? 1 : 0;
        players[target].push(deck.pop(), deck.pop());
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

init();
