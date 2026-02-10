let deck = [];
let hand = [];
let topCard = null;
const colors = ['red', 'blue', 'green', 'yellow'];

function init() {
    createDeck();
    // Start Game: Draw 7 cards
    for(let i=0; i<7; i++) hand.push(deck.pop());
    // Set First Discard
    topCard = deck.pop();
    while(topCard.color === 'black') { deck.push(topCard); shuffle(deck); topCard = deck.pop(); }
    render();
}

function createDeck() {
    colors.forEach(c => {
        for(let i=0; i<=12; i++) {
            deck.push({ color: c, value: i, img: `${c}${i}.png` });
            if(i !== 0) deck.push({ color: c, value: i, img: `${c}${i}.png` });
        }
    });
    for(let i=0; i<4; i++) {
        deck.push({ color: 'black', value: 'wild', img: 'wild.png' });
        deck.push({ color: 'black', value: 'draw4', img: 'draw4.png' });
    }
    shuffle(deck);
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

function render() {
    // Render Hand
    const handDiv = document.getElementById('player-hand');
    handDiv.innerHTML = '';
    hand.forEach((card, i) => {
        const img = document.createElement('img');
        img.src = `images/${card.img}`;
        img.className = 'card shadow';
        img.onclick = () => playCard(i);
        handDiv.appendChild(img);
    });

    // Render Discard
    document.getElementById('discard-pile').innerHTML = `<img src="images/${topCard.img}" class="card shadow">`;
}

function playCard(i) {
    const card = hand[i];
    // RULE CHECK: Color on Color OR Number on Number OR Wild
    if (card.color === 'black' || card.color === topCard.color || card.value === topCard.value) {
        topCard = hand.splice(i, 1)[0];
        
        if (topCard.color === 'black') {
            document.getElementById('wild-overlay').classList.remove('hidden');
        } else {
            document.getElementById('status-message').innerText = "Nice move!";
            render();
        }
    } else {
        document.getElementById('status-message').innerText = "Invalid Move! Match Color or Number.";
    }
}

function autoDraw() {
    // Check if player ALREADY has a playable card
    const hasMove = hand.some(c => c.color === 'black' || c.color === topCard.color || c.value === topCard.value);
    
    if (hasMove) {
        document.getElementById('status-message').innerText = "You have a card you can play!";
        return;
    }

    // Auto-draw until a playable card is found
    let drawnCard = deck.pop();
    hand.push(drawnCard);
    document.getElementById('status-message').innerText = "Drawing...";
    
    render();
}

function pickColor(c) {
    topCard.color = c; // Change the required color
    document.getElementById('wild-overlay').classList.add('hidden');
    document.getElementById('status-message').innerText = `Color changed to ${c}!`;
    render();
}

document.getElementById('draw-pile').onclick = autoDraw;
init();
