const PUNTEGGIO_MASSIMO = 5000;
const MAX_DIFFERENZA_MINUTI = 15;
const NUMERO_ROUND = 9;

let punteggioTotale = 0;
let roundCorrente = 0;
let goalSelezionati = [];
let datiDiGioco = [];
let partitaInCorso = false;

const ui = {
    round: document.getElementById('round-counter'),
    progress: document.getElementById('progress-bar'),
    progressTrack: document.querySelector('.progress-track'),
    descrizione: document.getElementById('descrizione-partita'),
    immagine: document.getElementById('immagine-goal'),
    input: document.getElementById('stima-input'),
    verifica: document.getElementById('btn-verifica'),
    next: document.getElementById('btn-next'),
    feedback: document.getElementById('risultato-feedback'),
    punteggio: document.getElementById('punteggio-totale'),
    roundDisplay: document.querySelector('.round-display')
};

function calcolaPuntiMinuto(stimaUtente, minutoTarget) {
    const differenza = Math.abs(stimaUtente - minutoTarget);
    if (differenza === 0) return PUNTEGGIO_MASSIMO;
    if (differenza >= MAX_DIFFERENZA_MINUTI) return 0;
    return Math.round(PUNTEGGIO_MASSIMO * (1 - differenza / MAX_DIFFERENZA_MINUTI));
}

function mescola(array) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

function aggiornaProgresso(valore) {
    const percentuale = Math.min(100, (valore / NUMERO_ROUND) * 100);
    ui.progress.style.width = `${percentuale}%`;
    ui.progressTrack.setAttribute('aria-valuenow', String(valore));
}

function animaElemento(elemento, classe) {
    elemento.classList.remove(classe);
    void elemento.offsetWidth;
    elemento.classList.add(classe);
}

function aggiornaPunteggio() {
    ui.punteggio.textContent = punteggioTotale.toLocaleString('it-IT');
    animaElemento(ui.punteggio, 'score-pop');
}

function mostraMessaggio(titolo, testo, tipo = 'info') {
    ui.feedback.className = `feedback-box feedback-${tipo}`;
    ui.feedback.innerHTML = `<p class="feedback-title">${titolo}</p><p>${testo}</p>`;
    ui.feedback.style.display = 'block';
    animaElemento(ui.feedback, 'feedback-enter');
}

function caricaDati() {
    datiDiGioco = Array.isArray(window.GOAL_DATA) ? window.GOAL_DATA : [];

    if (datiDiGioco.length < NUMERO_ROUND) {
        ui.round.textContent = 'DATI NON DISPONIBILI';
        ui.descrizione.textContent = 'Impossibile caricare la partita';
        ui.next.disabled = true;
        mostraMessaggio('Qualcosa non va', 'I dati dei gol non sono disponibili. Ricarica la pagina.', 'error');
        return;
    }

    ui.round.textContent = `${NUMERO_ROUND} ROUND · PRONTO`;
    ui.descrizione.textContent = 'Quanto conosci i gol che hanno fatto la storia?';
    ui.next.disabled = false;
}

function iniziaGioco() {
    if (datiDiGioco.length < NUMERO_ROUND) {
        mostraMessaggio('Dati non disponibili', 'Ricarica la pagina e riprova.', 'error');
        return;
    }

    goalSelezionati = mescola(datiDiGioco).slice(0, NUMERO_ROUND);
    punteggioTotale = 0;
    roundCorrente = 0;
    partitaInCorso = true;
    aggiornaPunteggio();
    aggiornaProgresso(0);
    ui.next.onclick = vaiAlProssimoRound;
    vaiAlProssimoRound();
}

function vaiAlProssimoRound() {
    if (roundCorrente >= NUMERO_ROUND) {
        mostraRisultatoFinale();
        return;
    }

    roundCorrente += 1;
    const goalCorrente = goalSelezionati[roundCorrente - 1];

    ui.round.textContent = `ROUND ${roundCorrente} / ${NUMERO_ROUND}`;
    ui.descrizione.textContent = goalCorrente.partita;
    ui.immagine.classList.add('image-loading');
    ui.immagine.onload = () => ui.immagine.classList.remove('image-loading');
    ui.immagine.src = `./images/${goalCorrente.immagine}`;
    ui.immagine.alt = `Gol: ${goalCorrente.partita}`;
    ui.input.value = '';
    ui.input.style.display = 'block';
    ui.input.disabled = false;
    ui.verifica.style.display = 'block';
    ui.next.style.display = 'none';
    ui.next.classList.remove('full-width-action');
    ui.feedback.style.display = 'none';
    aggiornaProgresso(roundCorrente);
    animaElemento(ui.roundDisplay, 'round-enter');
}

function verificaStima() {
    const stimaUtente = Number.parseInt(ui.input.value, 10);

    if (Number.isNaN(stimaUtente) || stimaUtente < 1 || stimaUtente > 125) {
        mostraMessaggio('Inserisci un minuto valido', 'Scegli un numero compreso tra 1 e 125.', 'error');
        animaElemento(ui.input, 'input-error');
        return;
    }

    const goalCorrente = goalSelezionati[roundCorrente - 1];
    const differenza = Math.abs(stimaUtente - goalCorrente.minutoEsatto);
    const puntiRound = calcolaPuntiMinuto(stimaUtente, goalCorrente.minutoEsatto);
    punteggioTotale += puntiRound;

    let giudizio = 'Tiro fuori misura';
    let icona = '↗';
    let tipo = 'miss';
    if (differenza === 0) {
        giudizio = 'Minuto perfetto!';
        icona = '★';
        tipo = 'perfect';
    } else if (differenza <= 2) {
        giudizio = 'Quasi perfetto!';
        icona = '🔥';
        tipo = 'perfect';
    } else if (differenza <= 5) {
        giudizio = 'Ottima intuizione';
        icona = '✓';
        tipo = 'good';
    }

    ui.feedback.className = `feedback-box feedback-${tipo}`;
    ui.feedback.innerHTML = `
        <div class="result-heading"><span class="result-icon">${icona}</span><span>${giudizio}</span></div>
        <div class="result-grid">
            <div><span>Minuto reale</span><strong>${goalCorrente.minutoEsatto}'</strong></div>
            <div><span>La tua stima</span><strong>${stimaUtente}'</strong></div>
            <div><span>Differenza</span><strong>${differenza} min</strong></div>
            <div><span>Punti round</span><strong>+${puntiRound.toLocaleString('it-IT')}</strong></div>
        </div>`;
    ui.feedback.style.display = 'block';
    animaElemento(ui.feedback, 'feedback-enter');

    aggiornaPunteggio();
    ui.input.disabled = true;
    ui.verifica.style.display = 'none';
    ui.next.textContent = roundCorrente === NUMERO_ROUND ? 'VEDI RISULTATO →' : 'PROSSIMO GOL →';
    ui.next.style.display = 'block';
}

function mostraRisultatoFinale() {
    const massimoTotale = PUNTEGGIO_MASSIMO * NUMERO_ROUND;
    const percentuale = Math.round((punteggioTotale / massimoTotale) * 100);
    let titolo = 'Buona partita!';
    let descrizione = 'Hai ancora qualche gol storico da ripassare.';

    if (percentuale >= 80) {
        titolo = 'Fuoriclasse assoluto!';
        descrizione = 'Conosci i momenti decisivi come un vero telecronista.';
    } else if (percentuale >= 55) {
        titolo = 'Grande prestazione!';
        descrizione = 'Ottimo fiuto per i minuti che hanno fatto la storia.';
    }

    ui.descrizione.textContent = titolo;
    ui.round.textContent = 'PARTITA CONCLUSA';
    ui.immagine.src = 'tempo.jpg';
    ui.immagine.alt = 'Goal Time Guess';
    ui.input.style.display = 'none';
    ui.verifica.style.display = 'none';
    ui.feedback.className = 'feedback-box feedback-final';
    ui.feedback.innerHTML = `
        <p class="final-score">${punteggioTotale.toLocaleString('it-IT')}</p>
        <p class="final-label">punti su ${massimoTotale.toLocaleString('it-IT')}</p>
        <div class="final-meter"><span style="width: ${percentuale}%"></span></div>
        <p>${descrizione}</p>`;
    ui.feedback.style.display = 'block';
    ui.next.textContent = 'GIOCA ANCORA';
    ui.next.onclick = iniziaGioco;
    ui.next.style.display = 'block';
    ui.next.classList.add('full-width-action');
    partitaInCorso = false;
    aggiornaProgresso(NUMERO_ROUND);
    animaElemento(ui.roundDisplay, 'round-enter');
}

ui.verifica.addEventListener('click', verificaStima);
ui.next.onclick = iniziaGioco;
ui.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !ui.input.disabled && partitaInCorso) verificaStima();
});

caricaDati();
