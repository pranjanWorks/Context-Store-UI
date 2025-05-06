import { useState } from "react";
import SearchResultsTable from "./SearchResultsTable";
import SearchBox from "./SearchBox";

const ContextStore = () => {
      const [results, setResults] = useState([]);

      return (
        <div className="h-full w-full p-4 flex flex-col justify-start items-center gap-16">
            <SearchBox setResults={setResults} />
            {results.length > 0 && (
                <SearchResultsTable results={results} />
            )}
        </div>
      );
};

export default ContextStore;