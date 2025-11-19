import { useGameStore } from '../store';

export const UI = () => {
  const { balance, bet, winAmount, status, setBet, spin } = useGameStore();

  const handleSpin = () => {
    spin();
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
      color: 'white',
      fontFamily: 'sans-serif',
      gap: '40px',
      pointerEvents: 'none' // Allow clicking through to canvas for orbit controls
    }}>
      <div style={{ pointerEvents: 'auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>BALANCE</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${balance.toFixed(2)}</div>
      </div>

      <div style={{ pointerEvents: 'auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>WIN</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffd700' }}>
            {winAmount > 0 ? `$${winAmount.toFixed(2)}` : '--'}
        </div>
      </div>

      <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>BET</div>
        <div style={{ display: 'flex', gap: '5px' }}>
            <button 
                onClick={() => setBet(Math.max(1, bet - 1))}
                disabled={status === 'spinning'}
                style={{ padding: '5px 10px', cursor: 'pointer' }}
            >-</button>
            <input 
                type="number" 
                value={bet} 
                onChange={(e) => setBet(Number(e.target.value))}
                disabled={status === 'spinning'}
                style={{ width: '60px', textAlign: 'center' }}
            />
            <button 
                onClick={() => setBet(bet + 1)}
                disabled={status === 'spinning'}
                style={{ padding: '5px 10px', cursor: 'pointer' }}
            >+</button>
        </div>
      </div>

      <div style={{ pointerEvents: 'auto' }}>
        <button
          onClick={handleSpin}
          disabled={status === 'spinning' || balance < bet}
          style={{
            padding: '15px 40px',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: status === 'spinning' ? '#555' : '#ff0000',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: status === 'spinning' ? 'default' : 'pointer',
            boxShadow: '0 4px 0 #990000',
            transform: status === 'spinning' ? 'translateY(4px)' : 'none'
          }}
        >
          {status === 'spinning' ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>
      
      {status === 'win' && (
          <div style={{
              position: 'absolute',
              top: '-200px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#ffd700',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
              pointerEvents: 'none'
          }}>
              BIG WIN!
          </div>
      )}
    </div>
  );
};

