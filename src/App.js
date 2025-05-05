import './App.css';
import { AppContextProvider } from './context';
import ContextStore from './ContextStore';

function App() {
  return (
    <AppContextProvider>
      <ContextStore />
    </AppContextProvider>
  );
}

export default App;
