// --- Game State ---
let deck = [];
let players = [[], []]; // Player 1 and Player 2 hands
let playerNames = ["P1", "P2"];
let turn = 0; // 0 or 1
let discard = null;
let isAnimating = false;

// --- Setup ---
function startGame() {
    playerNames[0] = document.getElementById('p1-name').value || "Player 1";
    playerNames[1] = document.getElementById('p2-name').value || "Player 2";
    
    buildDeck();
    shuffle(deck);
    
    // Deal 7 cards to each
    for(let i=0; i<7; i++) {
        players[0].push(deck.pop());
        players[1].push(deck.pop());
    }
    
    // Initial Discard
    discard = deck.pop();
    while(discard.color === 'black') { 
        deck.push(discard); shuffle(deck); discard = deck.pop(); 
    }
    
    document.getElementById('setup-screen').classList.add('hidden');
    prepTurn();
}

function buildDeck() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    deck = [];
    
    colors.forEach(c => {
        // 0-9
        for(let i=0; i<=9; i++) {
            deck.push({ color: c, value: i, type: 'number', img: `${c}.png` });
            if(i!==0) deck.push({ color: c, value: i, type: 'number', img: `${c}.png` });
        }
        // Action Cards (10=Skip, 11=Reverse, 12=+2)
        ['Skip', 'Rev', '+2'].forEach(action => {
             deck.push({ color: c, value: action, type: 'action', img: `${c}.png` });
             deck.push({ color: c, value: action, type: 'action', img: `${c}.png` });
        });
    });
    
    // Wilds
    for(let i=0; i<4; i++) {
        deck.push({ color: 'black', value: 'W', type: 'wild', img: 'wild.jpg' });
        deck.push({ color: 'black', value: '+4', type: 'wild4', img: 'draw4.jpg' });
    }
}

// --- Rendering ---
function renderGame() {
    // 1. Render Discard Pile
    const discardEl = document.getElementById('discard-pile');
    discardEl.innerHTML = '';
    discardEl.appendChild(createCardElement(discard));

    // 2. Render Hand
    const handEl = document.getElementById('hand');
    handEl.innerHTML = '';
    
    players[turn].forEach((card, index) => {
        const cardNode = createCardElement(card);
        cardNode.onclick = () => tryPlayCard(index, cardNode);
        handEl.appendChild(cardNode);
    });

    // 3. Update Text
    document.getElementById('turn-indicator').innerText = playerNames[turn].toUpperCase() + "'S TURN";
}

// Helper: Creates the visual card div
function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card-container';
    
    // Use the generic background image
    div.style.backgroundImage = `url('images/${card.img}')`;
    
    // Add text overlay so we know what number it is!
    // Don't show text for back of cards or if it's a graphical wild
    if(card.value !== 'wild' && card.value !== 'draw4') {
        const overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        overlay.innerText = card.value;
        div.appendChild(overlay);
        
        const corner = document.createElement('div');
        corner.className = 'card-corner';
        corner.innerText = card.value;
        div.appendChild(corner);
    }
    return div;
}

// --- Gameplay & Animation ---
function tryPlayCard(index, cardElem) {
    if(isAnimating) return;
    const card = players[turn][index];
    
    // Logic: Match color, value, or black
    if(card.color === 'black' || card.color === discard.color || card.value === discard.value) {
        isAnimating = true;
        
        // FLY ANIMATION: Hand -> Discard
        const discardRect = document.getElementById('discard-pile').getBoundingClientRect();
        animateFly(cardElem, discardRect, () => {
            // Commit Move
            discard = players[turn].splice(index, 1)[0];
            
            // Handle Effects
            if(discard.color === 'black') {
                document.getElementById('wild-modal').classList.remove('hidden');
                isAnimating = false; // Wait for user to pick color
            } else {
                handleAction(discard);
            }
        });
        
    } else {
        // Shake animation for invalid
        cardElem.classList.add('shake');
        showMessage("Can't play that!");
        setTimeout(()=> cardElem.classList.remove('shake'), 500);
    }
}

function handleDraw() {
    if(isAnimating) return;
    isAnimating = true;
    
    // FLY ANIMATION: Deck -> Hand
    const deckEl = document.getElementById('deck-container');
    const handEl = document.getElementById('hand');
    const newCard = deck.pop();
    
    // Create a temp visual for animation
    const tempCard = createCardElement(newCard); // Reveal card as it flies
    // OR keep it face down:
    const flyImg = document.createElement('img');
    flyImg.src = 'images/back.png';
    flyImg.className = 'flying-card';
    
    animateFly(deckEl, handEl.getBoundingClientRect(), () => {
        players[turn].push(newCard);
        renderGame();
        isAnimating = false;
        
        // Auto-pass if not playable? (Optional, skipping for now)
        if(!canPlay(newCard)) {
            setTimeout(passTurn, 1000);
        } else {
            showMessage("You drew a playable card!");
        }
    }, 'images/back.png'); // Fly image source
}

// --- The Animation Engine ---
function animateFly(startElem, endRect, callback, imgSrcOverride) {
    const rect = startElem.getBoundingClientRect();
    
    const flyer = document.createElement('div');
    flyer.className = 'flying-card';
    
    // If it's a DOM element (card), clone its style
    if(!imgSrcOverride && startElem.style) {
        flyer.style.backgroundImage = startElem.style.backgroundImage;
        flyer.innerHTML = startElem.innerHTML; // Copy numbers
        flyer.style.backgroundColor = 'white';
    } else {
        flyer.style.backgroundImage = `url('${imgSrcOverride}')`;
    }

    flyer.style.left = rect.left + 'px';
    flyer.style.top = rect.top + 'px';
    
    document.getElementById('anim-layer').appendChild(flyer);
    
    // Hide original
    startElem.style.opacity = 0;

    // Trigger Move
    requestAnimationFrame(() => {
        flyer.style.left = (endRect.left + 20) + 'px'; // Center offset
        flyer.style.top = endRect.top + 'px';
        flyer.style.transform = `scale(1) rotate(${Math.random()*10 - 5}deg)`;
    });

    setTimeout(() => {
        flyer.remove();
        callback();
    }, 600);
}

// --- Logic Helpers ---
function handleAction(card) {
    const opponent = (turn + 1) % 2;
    
    if(card.value === 'Skip' || card.value === 'Rev') {
        showMessage("SKIP! Play again.");
        renderGame();
        isAnimating = false;
        checkWin();
    } else if(card.value === '+2') {
        showMessage("Opponent draws 2!");
        players[opponent].push(deck.pop(), deck.pop());
        renderGame();
        isAnimating = false;
        checkWin(); // In 2P, +2 also skips, so play again
    } else {
        checkWin();
        if(players[turn].length > 0) passTurn();
    }
}

function resolveWild(color) {
    discard.color = color;
    document.getElementById('wild-modal').classList.add('hidden');
    
    if(discard.value === '+4') {
        const opponent = (turn + 1) % 2;
        players[opponent].push(deck.pop(), deck.pop(), deck.pop(), deck.pop());
        showMessage("Opponent draws 4!");
    }
    
    checkWin();
    if(players[turn].length > 0) passTurn();
}

function passTurn() {
    isAnimating = false;
    turn = (turn + 1) % 2;
    document.getElementById('game-ui').classList.add('hidden');
    document.getElementById('pass-screen').classList.remove('hidden');
    document.getElementById('next-player-msg').innerText = `READY ${playerNames[turn]}?`;
}

function startTurn() {
    document.getElementById('pass-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    renderGame();
}

function checkWin() {
    if(players[turn].length === 0) {
        alert(playerNames[turn] + " WINS!");
        location.reload();
    }
}

function showMessage(msg) {
    const box = document.getElementById('message-box');
    box.innerText = msg;
    setTimeout(() => box.innerText = "", 2000);
}

function canPlay(card) {
    return (card.color === 'black' || card.color === discard.color || card.value === discard.value);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
