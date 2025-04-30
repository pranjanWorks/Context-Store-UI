import { useCallback, useState, useMemo, useRef, useLayoutEffect } from 'react';
import OptionList from './OptionList';

const SearchBox = () => {
    const [focusInSearch, setFocusInSearch] = useState(false);
    const [filters, setFilters] = useState([]);
    const [isHoverFilters, setIsHoverFilters] = useState(false);
    const [renderToggle, setRenderToggle] = useState(false);
    const searchInput = useRef(null);
    
    const onFocusInSearch = useCallback(() => {
        setFocusInSearch(true);
    }, []);

    const onFocusOutSearch = useCallback((e: Event) => {
        if (!isHoverFilters) {
            setFocusInSearch(false);
        }
        setRenderToggle(!renderToggle);
    }, [isHoverFilters]);

    const addFilter = useCallback((filter) => {
        setFilters([...filters, filter]);
    }, [filters]);

    const searchBoxWrapper = useMemo(() => 
        `w-full h-16 rounded-lg border border-gray-300 bg-gray-50 p-4 ${focusInSearch ? "ring-blue-500 border-blue-500" : ""}`, 
        [focusInSearch]
    );

    const availableFilters = useMemo(() => [
        { name: 'Disposition' },
        { name: 'Agent' },
        { name: 'Contact' },
        { name: 'Intent' }
    ], []);

    const filtersList = useMemo(() => (
        <OptionList options={availableFilters} onClickOption={addFilter} onMouseEnter={() => setIsHoverFilters(true)} onMouseLeave={() => setIsHoverFilters(false)} />
    ), [availableFilters, addFilter]);

    useLayoutEffect(() => {
        focusInSearch ? searchInput.current.focus() : searchInput.current.blur();
    });
    
    return (
        <div className={searchBoxWrapper}>
            <div className="flex">
                <ul>
                    {filters.map((filter, idx) => (
                        <li style={{display: 'inline'}} className="display" key={idx}>{filter?.name}</li>
                    ))}
                </ul>
                <input ref={searchInput} className="w-full h-full p-2 bg-gray-50 outline-none" placeholder="Search through tags or text" onFocus={onFocusInSearch} onBlur={onFocusOutSearch} />
            </div>
            {focusInSearch && filtersList}
        </div>
    );
}

export default SearchBox;