import { Chat } from './chat';
import NetworkProvider from './networkStateProvider';

export function App() {
  return (
    <NetworkProvider url={new URL("ws://localhost:8080")}>
      <Chat />
    </NetworkProvider>
  );
}

export default App;
