import { SlotMachine } from './components/SlotMachine';
import { UI } from './components/UI';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <SlotMachine />
      <UI />
    </div>
  );
}

export default App;

