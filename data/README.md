# Dati Minuto Giusto

`goals.json` è l'unico archivio usato dal sito. Contiene esclusivamente record con `verificato: true` e con fonte e licenza compilate.

`goals-da-verificare.json` è un archivio di lavoro locale, escluso da Git e dalla pubblicazione. Non inserire immagini in nessuno dei due file.

## Campi

- `id`: intero univoco.
- `partita`: descrizione testuale dell'evento.
- `minuto_assoluto`: intero da 1 a 120. I rigori finali sono esclusi.
- `recupero`: minuti di recupero, intero maggiore o uguale a zero.
- `difficolta`: `facile`, `media`, `difficile`, oppure `non_classificata` per i record da verificare.
- `tipo_gol`: `area`, `fuori_area`, `rigore`, `testa`, `punizione`, `azione`, `altro`, oppure `non_classificato` per i record da verificare.
- `fonte`, `licenza_fonte`: obbligatori e non vuoti per un record verificato.
- `verificato`: solo `true` abilita la pubblicazione.

Verifica l'archivio con `node scripts/validate-goals.js`.
