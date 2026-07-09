'use client';

// =====================================================================
// L'EFFET CISEAU - élément signature
// ---------------------------------------------------------------------
// Le chiffre d'affaires (navy) monte, la marge (rouge) stagne puis
// s'effrite : l'écart qui se creuse est la "fuite" de marge. Les tracés
// s'animent au montage (voir .path-ca / .path-marge dans globals.css).
// =====================================================================

export default function ScissorChart() {
  return (
    <div className="scissor">
      <svg
        viewBox="0 0 600 300"
        role="img"
        aria-label="Le chiffre d'affaires progresse pendant que la marge stagne : l'effet ciseau."
      >
        {/* Zone d'écart (la fuite) */}
        <polygon
          className="gap-fill"
          points="40,215 175,175 310,140 445,100 560,65 560,240 445,236 310,232 175,228 40,222"
        />

        {/* Chiffre d'affaires : en hausse */}
        <polyline
          className="path-ca"
          points="40,215 175,175 310,140 445,100 560,65"
        />

        {/* Marge : quasi plate puis déclinante */}
        <polyline
          className="path-marge"
          points="40,222 175,228 310,232 445,236 560,240"
        />

        {/* Repères texte */}
        <text
          x="556"
          y="52"
          textAnchor="end"
          fontSize="18"
          fontWeight="700"
          fill="#13204D"
          fontFamily="'Open Sans', sans-serif"
        >
          CA
        </text>
        <text
          x="556"
          y="262"
          textAnchor="end"
          fontSize="18"
          fontWeight="700"
          fill="#ec3e2d"
          fontFamily="'Open Sans', sans-serif"
        >
          Marge
        </text>
      </svg>

      <div className="scissor__legend">
        <span className="scissor__key">
          <span className="scissor__swatch" style={{ background: '#13204D' }} />
          Chiffre d&apos;affaires
        </span>
        <span className="scissor__key">
          <span className="scissor__swatch" style={{ background: '#ec3e2d' }} />
          Marge
        </span>
      </div>
    </div>
  );
}
