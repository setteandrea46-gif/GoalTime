// --- CONFIGURAZIONE GIOCO ---
const PUNTEGGIO_MASSIMO = 5000;
const MAX_DIFFERENZA_MINUTI = 15; // Errore massimo: se l'errore è 15 minuti o più, i punti sono 0.
const NUMERO_ROUND = 9; // Gioca 9 round per partita

// --- VARIABILI DI STATO ---
let punteggioTotale = 0;
let roundCorrente = 0;
let goalSelezionati = []; // I goal casuali per la partita corrente
let datiDiGioco = []; // Tutti i goal caricati dal JSON
let partitaInCorso = false;


// --- FUNZIONI DI UTILITÀ E LOGICA ---

/**
 * Calcola i punti guadagnati in base a quanto la stima si avvicina al minuto esatto.
 * La vicinanza è lineare: più sei vicino, più i punti si avvicinano a 5000.
 * @returns {number} I punti guadagnati (int).
 */
function calcolaPuntiMinuto(stimaUtente, minutoTarget) {
    const differenza = Math.abs(stimaUtente - minutoTarget); 
    
    if (differenza === 0) {
        return PUNTEGGIO_MASSIMO; // Perfetto!
    } 
    
    if (differenza >= MAX_DIFFERENZA_MINUTI) {
        return 0; // Troppo lontano
    }
    
    // Formula lineare: Punti = MaxPunti * (1 - frazioneErrore)
    const frazioneErrore = differenza / MAX_DIFFERENZA_MINUTI;
    let punti = PUNTEGGIO_MASSIMO * (1.0 - frazioneErrore);
    
    return Math.round(punti); 
}

/**
 * 1. Carica i dati dal file goals.json.
 */
async function caricaDati() {
    try {
        // NOTA: 'fetch' richiede che la pagina sia servita da un server (localhost:8000)
        const response = await fetch('./data/goals.json'); 
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}. Assicurati di essere su localhost.`);
        }
        datiDiGioco = await response.json();

        if (datiDiGioco.length < NUMERO_ROUND) {
            document.getElementById('round-counter').textContent = "ERRORE: Dati insufficienti in goals.json.";
            return;
        }

        // Dati caricati, pronto per l'avvio
        document.getElementById('round-counter').textContent = `Pronto a giocare ${NUMERO_ROUND} round!`;
        document.getElementById('descrizione-partita').textContent = "Premi INIZIA per iniziare la sfida.";
        document.getElementById('stima-input').disabled = false;

    } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        document.getElementById('descrizione-partita').textContent = "ERRORE CRITICO: Controlla la console per i dettagli (F12).";
    }
}

/**
 * 2. Inizializza una nuova partita.
 */
function iniziaGioco() {
    if (datiDiGioco.length === 0) {
        alert("Dati non ancora caricati. Riprova tra un attimo o controlla il file goals.json.");
        return;
    }
    
    // Mescola i goal e ne prende il numero necessario per il gioco
    goalSelezionati = datiDiGioco
                        .sort(() => 0.5 - Math.random()) 
                        .slice(0, NUMERO_ROUND); 

    punteggioTotale = 0;
    roundCorrente = 0;
    partitaInCorso = true;
    
    // Collega il pulsante "Next" alla funzione di avanzamento
    document.getElementById('btn-next').onclick = vaiAlProssimoRound;
    
    vaiAlProssimoRound();
}


/**
 * 3. Prepara e mostra l'interfaccia per il round successivo.
 */
function vaiAlProssimoRound() {
    if (roundCorrente >= NUMERO_ROUND) {
        mostraRisultatoFinale();
        return;
    }
    
    roundCorrente++;
    const goalCorrente = goalSelezionati[roundCorrente - 1];
    
    // --- Aggiornamento dell'Interfaccia (collegamento con home.html) ---
    
    document.getElementById('round-counter').textContent = `Round ${roundCorrente}/${NUMERO_ROUND}`;
    // Costruisce il percorso completo dell'immagine
    document.getElementById('immagine-goal').src = `./images/${goalCorrente.immagine}`; 
    document.getElementById('descrizione-partita').textContent = goalCorrente.partita;
    document.getElementById('punteggio-totale').textContent = punteggioTotale;
    
    // Resetta input e pulsanti
    document.getElementById('stima-input').value = '';
    document.getElementById('stima-input').disabled = false;
    document.getElementById('btn-verifica').style.display = 'block'; 
    document.getElementById('btn-next').style.display = 'none'; 
    document.getElementById('risultato-feedback').style.display = 'none';
    document.getElementById('btn-next').textContent = "Next"; 
}


/**
 * 4. Gestisce il click su "Indovina".
 */
function verificaStima() {
    const goalCorrente = goalSelezionati[roundCorrente - 1];
    const inputElement = document.getElementById('stima-input');
    const stimaUtente = parseInt(inputElement.value);

    // Validazione
    if (isNaN(stimaUtente) || stimaUtente < 1 || stimaUtente > 120) {
        alert("Inserisci un minuto valido compreso tra 1 e 120.");
        return;
    }

    const puntiRound = calcolaPuntiMinuto(stimaUtente, goalCorrente.minutoEsatto);
    punteggioTotale += puntiRound;
    const differenza = Math.abs(stimaUtente - goalCorrente.minutoEsatto);

    // --- Aggiornamento del Feedback ---
    const feedbackDiv = document.getElementById('risultato-feedback');
    feedbackDiv.innerHTML = `
        <p>Minuto Reale: <strong>${goalCorrente.minutoEsatto}</strong></p>
        <p>La tua stima: <strong>${stimaUtente}</strong></p>
        <p>Differenza: ${differenza} minuti</p>
        <p>Punti guadagnati in questo round: <strong>${puntiRound}</strong></p>
    `;
    feedbackDiv.style.display = 'block';

    document.getElementById('punteggio-totale').textContent = punteggioTotale;

    // Disabilita input e mostra "Next"
    inputElement.disabled = true;
    document.getElementById('btn-verifica').style.display = 'none';
    document.getElementById('btn-next').style.display = 'block'; 
}


/**
 * 5. Mostra il risultato finale.
 */
function mostraRisultatoFinale() {
    document.getElementById('descrizione-partita').textContent = `Partita conclusa! Complimenti!`;
    document.getElementById('round-counter').textContent = "GIOCO TERMINATO";
    
    document.getElementById('btn-next').textContent = "GIOCA ANCORA";
    document.getElementById('btn-next').onclick = iniziaGioco; 
    document.getElementById('btn-next').style.display = 'block';
    document.getElementById('btn-verifica').style.display = 'none';
    document.getElementById('risultato-feedback').style.display = 'none';
    
    partitaInCorso = false;
    // Rimuove l'immagine per non lasciare l'ultima del round
    document.getElementById('immagine-goal').src = ""; 
}


// --- AVVIO E COLLEGAMENTO INIZIALE ---

// 1. Avvia la funzione di caricamento dati quando la pagina è pronta
document.addEventListener('DOMContentLoaded', caricaDati);

// 2. Collega la funzione verificaStima al pulsante "Indovina" (btn-verifica)
document.getElementById('btn-verifica').onclick = verificaStima;

// 3. Collega la funzione iniziaGioco al pulsante "INIZIA" (btn-next)
document.getElementById('btn-next').onclick = iniziaGioco;