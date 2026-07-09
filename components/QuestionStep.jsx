'use client';

// Une question = un libellé + des cartes-réponses.
// La sélection déclenche l'avancement automatique (géré par le parent).
export default function QuestionStep({ question, selected, onSelect, onBack }) {
  return (
    <div>
      <div className="eyebrow">{question.eyebrow}</div>
      <h2 className="q-title">{question.title}</h2>
      {question.help && <p className="q-help">{question.help}</p>}

      <div className="options" role="list">
        {question.options.map((opt) => {
          const isSel = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`option${isSel ? ' option--selected' : ''}`}
              onClick={() => onSelect(opt.id)}
              aria-pressed={isSel}
            >
              {opt.emoji && (
                <span className="option__emoji" aria-hidden="true">
                  {opt.emoji}
                </span>
              )}
              <span className="option__label">{opt.label}</span>
              <span className="option__tick" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {onBack && (
        <div style={{ marginTop: 22 }}>
          <button className="btn-ghost" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> Retour
          </button>
        </div>
      )}
    </div>
  );
}
