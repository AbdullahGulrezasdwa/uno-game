const handElement = document.getElementById('player-hand');
const discardElement = document.getElementById('discard-pile');
const drawPile = document.getElementById('draw-pile');

const COLORS = ['red', 'blue', 'green', 'yellow'];
let deck = [];
let playerHand = [];

// 1. Initialize the Deck (Handling your specific 52 + Wilds)
function createDeck() {
    deck = [];
    COLORS.forEach(color => {
        // Numbers 0-12 (10=Reverse, 11=Skip, 12=+2)
        for (let i = 0; i <= 12; i++) {
            deck.push({ color, value: i, image: `${color}${i}.png` });
            if (i !== 0) { // Standard UNO has two of 1-12
                deck.push({ color, value: i, image: `${color}${i}.png` });
            }
        }
    });

    // Add Wilds (4 of each)
    for (let i = 0; i < 4; i++) {
        deck.push({ color: 'black', value: 'wild', image: 'wild.png' });
        deck.push({ color: 'black', value: 'draw4', image: 'draw4.png' });
    }
}

// 2. Shuffle Function
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// 3. Render the Hand
function updateUI() {
    handElement.innerHTML = '';
    playerHand.forEach((card, index) => {
        const img = document.createElement('img');
        img.src = `images/${card.image}`;
        img.className = 'card shadow';
        if (card.color === 'black') img.classList.add('wild-card');
        
        // Play Card Logic
        img.onclick = () => playCard(index);
        
        handElement.appendChild(img);
    });
}

// 4. Game Actions
function playCard(index) {
    const card = playerHand.splice(index, 1)[0];
    
    // Move to discard pile
    discardElement.innerHTML = '';
    const img = document.createElement('img');
    img.src = `images/${card.image}`;
    img.className = 'card shadow';
    discardElement.appendChild(img);
    
    updateUI();
}

function drawCard() {
    if (deck.length > 0) {
        playerHand.push(deck.pop());
        updateUI();
    }
}

// 5. Start Game
drawPile.onclick = drawCard;

createDeck();
shuffleDeck();

// Deal starting hand (7 cards)
for (let i = 0; i < 7; i++) {
    playerHand.push(deck.pop());
}
updateUI();
