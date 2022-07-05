import { Chat } from './chat';
import NetworkProvider from './networkStateProvider';

export function App() {
  return (
    <NetworkProvider>
      <Chat />
    </NetworkProvider>
  );
}

export default App;
