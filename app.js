document.addEventListener('DOMContentLoaded', () => {
    let state = {
        deck: [],
        players: [[], []],
        names: ["P1", "P2"],
        turn: 0,
        discard: null,
        isBusy: false
    };

    // UI Bindings
    document.getElementById('start-btn').onclick = startGame;
    document.getElementById('next-turn-btn').onclick = startTurn;
    document.getElementById('deck').onclick = handleDraw;
    
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.onclick = () => resolveWild(btn.dataset.color);
    });

    function startGame() {
        state.names[0] = document.getElementById('p1-input').value || "Player 1";
        state.names[1] = document.getElementById('p2-input').value || "Player 2";
        
        buildDeck();
        shuffle(state.deck);
        
        state.players = [[], []];
        for(let i=0; i<7; i++) {
            state.players[0].push(state.deck.pop());
            state.players[1].push(state.deck.pop());
        }
        
        state.discard = state.deck.pop();
        while(state.discard.c === 'black') {
            state.deck.push(state.discard); shuffle(state.deck); state.discard = state.deck.pop();
        }

        document.getElementById('setup-screen').classList.add('hidden');
        prepNextTurn();
    }

    function buildDeck() {
        const colors = ['red', 'blue', 'green', 'yellow'];
        state.deck = [];
        colors.forEach(c => {
            for(let i=0; i<=12; i++) {
                let val = i;
                if(i === 10) val = "Skip";
                if(i === 11) val = "Rev";
                if(i === 12) val = "+2";
                state.deck.push({ c: c, v: val, img: c + ".png" });
                if(i !== 0) state.deck.push({ c: c, v: val, img: c + ".png" });
            }
        });
        for(let i=0; i<4; i++) {
            state.deck.push({ c: 'black', v: 13, img: 'wild.jpg' });
            state.deck.push({ c: 'black', v: 14, img: 'draw4.jpg' });
        }
    }

    function prepNextTurn() {
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('pass-screen').classList.remove('hidden');
        document.getElementById('pass-msg').innerText = `READY ${state.names[state.turn].toUpperCase()}?`;
    }

    function startTurn() {
        document.getElementById('pass-screen').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        render();
    }

    function render() {
        document.getElementById('turn-indicator').innerText = state.names[state.turn].toUpperCase();
        const zone = document.getElementById('discard-zone');
        zone.innerHTML = '';
        zone.appendChild(createCard(state.discard));

        const hand = document.getElementById('hand');
        hand.innerHTML = '';
        state.players[state.turn].forEach((card, idx) => {
            const el = createCard(card);
            el.classList.add('hand-card');
            el.onclick = () => playCard(idx, el);
            hand.appendChild(el);
        });
    }

function createCard(card) {
    const div = document.createElement('div');
    div.className = 'card-visual';
    
    // Fallback: If image fails, show the color anyway
    div.style.backgroundColor = card.c === 'black' ? '#222' : card.c;
    div.style.border = "2px solid white";
    
    // The actual image
    div.style.backgroundImage = `url('images/${card.img}')`;
    div.style.backgroundSize = "cover";

    if(card.v !== 13 && card.v !== 14) {
        const n = document.createElement('div');
        n.className = 'num';
        n.innerText = card.v;
        div.appendChild(n);
    }
    return div;
}

    function playCard(i, el) {
        if(state.isBusy) return;
        const card = state.players[state.turn][i];
        if(card.c === 'black' || card.c === state.discard.c || card.v === state.discard.v) {
            state.isBusy = true;
            const target = document.getElementById('discard-zone').getBoundingClientRect();
            animate(el, target, card.img, () => {
                state.discard = state.players[state.turn].splice(i, 1)[0];
                if(state.discard.c === 'black') {
                    document.getElementById('wild-modal').classList.remove('hidden');
                    state.isBusy = false;
                } else {
                    handleAction(state.discard);
                }
            });
        } else {
            el.style.animation = "shake 0.3s";
            setTimeout(() => el.style.animation = "", 300);
        }
    }

    function handleDraw() {
        if(state.isBusy) return;
        state.isBusy = true;
        const card = state.deck.pop();
        const start = document.getElementById('deck').getBoundingClientRect();
        const end = { left: window.innerWidth/2 - 60, top: window.innerHeight - 200 };
        animate(null, end, 'back.png', () => {
            state.players[state.turn].push(card);
            state.isBusy = false;
            render();
            if(!canPlay(card)) setTimeout(endTurn, 1000);
        }, start);
    }

    function handleAction(card) {
        const opp = (state.turn + 1) % 2;
        if(card.v === 'Skip' || card.v === 'Rev' || card.v === '+2') {
            if(card.v === '+2') state.players[opp].push(state.deck.pop(), state.deck.pop());
            state.isBusy = false;
            checkWin();
            render();
        } else {
            checkWin();
            endTurn();
        }
    }

    function resolveWild(color) {
        state.discard.c = color;
        document.getElementById('wild-modal').classList.add('hidden');
        if(state.discard.v === 14) {
            const opp = (state.turn + 1) % 2;
            for(let i=0; i<4; i++) state.players[opp].push(state.deck.pop());
        }
        checkWin();
        endTurn();
    }

    function endTurn() {
        if(state.players[state.turn].length === 0) return;
        state.turn = (state.turn + 1) % 2;
        state.isBusy = false;
        prepNextTurn();
    }

    function animate(el, to, img, cb, startRectOverride) {
        const rect = startRectOverride || el.getBoundingClientRect();
        const flyer = document.createElement('div');
        flyer.className = 'flying';
        flyer.style.backgroundImage = `url('images/${img}')`;
        flyer.style.left = rect.left + 'px';
        flyer.style.top = rect.top + 'px';
        document.getElementById('anim-layer').appendChild(flyer);
        if(el) el.style.opacity = 0;
        setTimeout(() => {
            flyer.style.left = to.left + 'px';
            flyer.style.top = to.top + 'px';
            flyer.style.transform = "rotate(360deg)";
        }, 10);
        setTimeout(() => { flyer.remove(); cb(); }, 600);
    }

    function canPlay(card) {
        return card.c === 'black' || card.c === state.discard.c || card.v === state.discard.v;
    }

    function checkWin() {
        if(state.players[state.turn].length === 0) {
            alert(state.names[state.turn].toUpperCase() + " WINS!");
            location.reload();
        }
    }

    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
    }
});
