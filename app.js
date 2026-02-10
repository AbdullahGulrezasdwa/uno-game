let deck = [];
const colors = ['red', 'blue', 'green', 'yellow'];

function createDeck() {
    deck = [];
    // Standard cards 0-12
    colors.forEach(color => {
        for (let i = 0; i <= 12; i++) {
            deck.push({ img: `${color}${i}.png` });
            if (i !== 0) deck.push({ img: `${color}${i}.png` });
        }
    });
    // Wilds
    for (let i = 0; i < 4; i++) {
        deck.push({ img: 'wild.png' });
        deck.push({ img: 'draw4.png' });
    }
    shuffle(deck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function drawCard() {
    if (deck.length === 0) {
        alert("Deck is empty! Resetting...");
        shuffleAndReset();
        return;
    }
    const card = deck.pop();
    const img = document.createElement('img');
    img.src = `images/${card.img}`;
    img.className = 'card shadow';
    
    // Clicking a card in your hand plays it
    img.onclick = function() {
        playCard(this);
    };
    
    document.getElementById('player-hand').appendChild(img);
}

function playCard(cardElement) {
    const discardPile = document.getElementById('discard-pile');
    discardPile.innerHTML = ''; // Clear old top card
    
    // Clone the card to the discard pile
    const playedCard = cardElement.cloneNode(true);
    playedCard.style.marginLeft = "0"; // Reset overlap
    discardPile.appendChild(playedCard);
    
    // Remove from hand
    cardElement.remove();
}

function shuffleAndReset() {
    document.getElementById('player-hand').innerHTML = '';
    document.getElementById('discard-pile').innerHTML = '<div class="placeholder">Play a card</div>';
    createDeck();
}

function clearHand() {
    document.getElementById('player-hand').innerHTML = '';
}

// Start with a fresh deck
createDeck();
