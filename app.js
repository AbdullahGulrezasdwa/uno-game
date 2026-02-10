// --- Game State ---
let deck = [];
let players = [[], []];
let playerNames = ["P1", "P2"];
let currentPlayer = 0;
let discard = null;
let isAnimating = false;
let wildPending = false;
let isDraw4 = false;

// --- Setup ---
function startGame() {
    const n1 = document.getElementById('p1-name-input').value;
    const n2 = document.getElementById('p2-name-input').value;
    if(n1) playerNames[0] = n1;
    if(n2) playerNames[1] = n2;

    document.getElementById('setup-screen').classList.add('hidden');
    init();
}

function init() {
    createDeck();
    shuffle(deck);
    
    // Deal 7 cards (Instant for setup)
    for(let i=0; i<7; i++) {
        players[0].push(deck.pop());
        players[1].push(deck.pop());
    }
    
    discard = deck.pop();
    while(discard.color === 'black' || discard.value > 9) {
        deck.push(discard); shuffle(deck); discard = deck.pop();
    }
    
    renderTable();
    showPassScreen();
}

function createDeck() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    deck = [];
    colors.forEach(c => {
        for(let i=0; i<=12; i++) {
            deck.push({ color: c, value: i, img: `${c}.png` }); // Using your naming
            if(i!==0) deck.push({ color: c, value: i, img: `${c}.png` });
        }
    });
    for(let i=0; i<4; i++) {
        deck.push({ color: 'black', value: 'wild', img: 'wild.jpg' });
        deck.push({ color: 'black', value: 'draw4', img: 'draw4.jpg' });
    }
}

// --- Animation Core ---
function animateCard(startElem, endElem, imgSrc, callback) {
    // 1. Get Coordinates
    const startRect = startElem.getBoundingClientRect();
    const endRect = endElem ? endElem.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight + 200, width: 0 };
    
    // 2. Create Flying Clone
    const flyer = document.createElement('img');
    flyer.src = imgSrc;
    flyer.className = 'flying-card';
    flyer.style.left = `${startRect.left}px`;
    flyer.style.top = `${startRect.top}px`;
    document.getElementById('animation-layer').appendChild(flyer);

    // 3. Trigger Animation (Wait 10ms for CSS to catch up)
    setTimeout(() => {
        flyer.style.left = `${endRect.left}px`;
        flyer.style.top = `${endRect.top}px`;
        flyer.style.transform = `rotate(${Math.random() * 20 - 10}deg) scale(1)`; // Add slight rotation
    }, 10);

    // 4. Cleanup
    setTimeout(() => {
        flyer.remove();
        if(callback) callback();
    }, 600); // Must match CSS transition time
}

// --- Gameplay ---
function startTurn() {
    document.getElementById('pass-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    renderHand();
}

function renderHand() {
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';
    
    players[currentPlayer].forEach((card, i) => {
        const img = document.createElement('img');
        img.src = `images/${card.img}`;
        img.className = 'card shadow';
        // Add ID to track position for animations
        img.id = `card-${i}`;
        img.onclick = () => playCard(i);
        handDiv.appendChild(img);
    });
}

function renderTable() {
    const pile = document.getElementById('discard-pile');
    pile.innerHTML = `<img src="images/${discard.img}" class="card shadow">`;
    document.getElementById('turn-display').innerText = playerNames[currentPlayer].toUpperCase();
}

function playCard(index) {
    if(isAnimating || wildPending) return;

    const card = players[currentPlayer][index];
    const cardElem = document.getElementById(`card-${index}`);
    const discardElem = document.getElementById('discard-pile');

    // Rule Check
    if (card.color === 'black' || card.color === discard.color || card.value === discard.value) {
        isAnimating = true;
        
        // FLY ANIMATION: Hand -> Discard
        animateCard(cardElem, discardElem, `images/${card.img}`, () => {
            // Logic after animation lands
            discard = players[currentPlayer].splice(index, 1)[0];
            renderTable();
            renderHand();
            
            if (discard.color === 'black') {
                isDraw4 = (discard.img === 'draw4.jpg');
                wildPending = true;
                document.getElementById('wild-modal').classList.remove('hidden');
                isAnimating = false;
            } else {
                handleActionCards(discard);
            }
        });
        
        // Hide original card instantly so it looks like it "lifted off"
        cardElem.style.opacity = '0'; 

    } else {
        // Shake Animation for Invalid Move
        cardElem.classList.add('shake-anim');
        showMessage("Can't play that!");
        setTimeout(() => cardElem.classList.remove('shake-anim'), 400);
    }
}

function handleDraw() {
    if(isAnimating || wildPending) return;
    
    const deckElem = document.getElementById('deck');
    // We aim for the center of the screen (hand area)
    const handArea = document.getElementById('hand'); 
    
    isAnimating = true;
    const newCard = deck.pop();
    
    // FLY ANIMATION: Deck -> Hand
    animateCard(deckElem, handArea, `images/back.png`, () => {
        players[currentPlayer].push(newCard);
        renderHand();
        isAnimating = false;
        
        // Auto-check if playable
        if(newCard.color === 'black' || newCard.color === discard.color || newCard.value === discard.value) {
            showMessage("Playable card drawn!");
        } else {
            showMessage("No match found.");
            setTimeout(nextTurn, 1000);
        }
    });
}

function handleActionCards(card) {
    const otherPlayer = (currentPlayer === 0) ? 1 : 0;
    
    if (card.value === 10 || card.value === 11) { // Skip/Reverse
        showMessage("SKIP! Go again!");
        isAnimating = false;
        checkWin();
    } else if (card.value === 12) { // +2
        showMessage("Opponent draws 2!");
        players[otherPlayer].push(deck.pop(), deck.pop());
        isAnimating = false;
        checkWin(); // In 2p, +2 skips opponent, so current player goes again
    } else {
        checkWin();
        if(players[currentPlayer].length > 0) nextTurn();
    }
}

function pickWild(c) {
    discard.color = c;
    wildPending = false;
    document.getElementById('wild-modal').classList.add('hidden');
    
    if(isDraw4) {
        const otherPlayer = (currentPlayer === 0) ? 1 : 0;
        players[otherPlayer].push(deck.pop(), deck.pop(), deck.pop(), deck.pop());
        showMessage("Opponent draws 4!");
    }
    checkWin();
    if(players[currentPlayer].length > 0) nextTurn();
}

function nextTurn() {
    currentPlayer = (currentPlayer === 0) ? 1 : 0;
    showPassScreen();
}

function showPassScreen() {
    document.getElementById('game-ui').classList.add('hidden');
    document.getElementById('pass-screen').classList.remove('hidden');
    document.getElementById('next-player-name').innerText = `READY ${playerNames[currentPlayer].toUpperCase()}?`;
}

function showMessage(msg) {
    const box = document.getElementById('msg-box');
    box.innerText = msg;
    box.classList.add('visible');
    setTimeout(() => box.classList.remove('visible'), 2000);
}

function checkWin() {
    if (players[currentPlayer].length === 0) {
        document.getElementById('game-ui').classList.add('hidden');
        const setup = document.getElementById('setup-screen');
        setup.innerHTML = `<h1>${playerNames[currentPlayer]} WINS!</h1><button class="menu-btn" onclick="location.reload()">PLAY AGAIN</button>`;
        setup.classList.remove('hidden');
        startConfetti();
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

// --- Confetti Engine (No external library needed) ---
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

    for(let i=0; i<300; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // Gravity
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            if(p.y > canvas.height) particles.splice(i, 1);
        });
        if(particles.length > 0) requestAnimationFrame(draw);
    }
    draw();
}
