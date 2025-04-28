import { useCallback, useState, useMemo } from 'react';
import OptionList from './OptionList';

const SearchBox = () => {
    const [focusInSearch, setFocusInSearch] = useState(false);
    
    const searchBoxWrapper = useMemo(() => 
        `w-full h-16 rounded-lg border border-gray-300 bg-gray-50 p-4 ${focusInSearch ? "ring-blue-500 border-blue-500" : ""}`, 
        [focusInSearch]
    );

    const exampleOptions = useMemo(() => [
        { name: 'option-1' },
        { name: 'option-2' },
        { name: 'option-2' }
    ], []);
    
    const onFocusInSearch = useCallback(() => {
        setFocusInSearch(true);
    }, []);

    const onFocusOutSearch = useCallback(() => {
        setFocusInSearch(false);
    }, []);
    
    return (
        <div className={searchBoxWrapper}>
            <input className="w-full h-full p-2 bg-gray-50 outline-none" placeholder="Search through tags or text" onFocus={onFocusInSearch} onBlur={onFocusOutSearch} />
            {focusInSearch && (
                <OptionList />
            )}
        </div>
    );
}

export default SearchBox;