const fs = require('fs');
const path = require('path');

const validDifficulties = new Set(['facile', 'media', 'difficile', 'non_classificata']);
const validGoalTypes = new Set(['area', 'fuori_area', 'rigore', 'testa', 'punizione', 'azione', 'altro', 'non_classificato']);
const required = ['id', 'partita', 'minuto_assoluto', 'recupero', 'difficolta', 'tipo_gol', 'fonte', 'licenza_fonte', 'verificato'];
function readJson(file) { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', file), 'utf8')); }
function validate(goals, label) {
  const ids = new Set(); let errors = 0; let verified = 0;
  for (const goal of goals) {
    const prefix = `${label} #${goal.id ?? '?'}`;
    for (const field of required) if (!(field in goal)) { console.error(`${prefix}: manca ${field}`); errors++; }
    if (ids.has(goal.id)) { console.error(`${prefix}: ID duplicato`); errors++; } ids.add(goal.id);
    if (!Number.isInteger(goal.minuto_assoluto) || goal.minuto_assoluto < 1 || goal.minuto_assoluto > 120) { console.error(`${prefix}: minuto_assoluto deve essere tra 1 e 120`); errors++; }
    if (!Number.isInteger(goal.recupero) || goal.recupero < 0) { console.error(`${prefix}: recupero non valido`); errors++; }
    if (!validDifficulties.has(goal.difficolta)) { console.error(`${prefix}: difficolta non valida`); errors++; }
    if (!validGoalTypes.has(goal.tipo_gol)) { console.error(`${prefix}: tipo_gol non valido`); errors++; }
    if (goal.verificato === true) { verified++; if (!goal.fonte || !goal.licenza_fonte) { console.error(`${prefix}: un gol verificato richiede fonte e licenza_fonte`); errors++; } }
  }
  return { errors, verified, unverified: goals.length - verified };
}
const published = validate(readJson('goals.json'), 'pubblicato');
const pending = validate(readJson('goals-da-verificare.json'), 'da verificare');
console.log(`Pronti da pubblicare: ${published.verified}`);
console.log(`Da verificare: ${pending.unverified}`);
if (published.verified < 5) console.warn('Nota: meno di 5 gol verificati; la modalità allenamento deve restare indisponibile.');
process.exitCode = published.errors + pending.errors ? 1 : 0;
