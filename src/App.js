import './App.css';
import { AppContextProvider } from './context';
import SearchBox from './SearchBox';

function App() {
  return (
    <AppContextProvider>
      <div className="h-screen w-full p-4 flex justify-center items-center">
        <SearchBox />
      </div>
    </AppContextProvider>
  );
}

export default App;
