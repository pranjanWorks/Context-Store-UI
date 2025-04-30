import { useCallback, useState, useMemo, useRef, useLayoutEffect } from 'react';
import OptionList from './OptionList';
import FilterChip from './FilterChip';

const SearchBox = () => {
    const [focusInSearch, setFocusInSearch] = useState(false);
    const [filters, setFilters] = useState([]);
    const [isHoverFilters, setIsHoverFilters] = useState(false);
    const [renderToggle, setRenderToggle] = useState(false);
    const [filterSelected, setFilterSelected] = useState(null);
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
        setFilters([...filters, { filter: filter.name }]);
        setFilterSelected(filter);
    }, [filters]);

    const setFilterOption = useCallback((filterOption) => {
        if (filterSelected) {
            const newFilter = { ...filters[filters.length-1], filterValue: filterOption.name };
            const updatedFilters = [ ...filters.slice(0,-1), newFilter ];
            setFilters(updatedFilters);
            setFilterSelected(null);
        }
    }, [filterSelected, filters]);

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

    const availableFilterOptions = useMemo(() => [
        { name: 'Filter option 1' },
        { name: 'Filter option 2' },
        { name: 'Filter option 3' },
        { name: 'Filter option 4' }
    ], []);

    const filtersList = useMemo(() => (
        <OptionList options={availableFilters} onClickOption={addFilter} onMouseEnter={() => setIsHoverFilters(true)} onMouseLeave={() => setIsHoverFilters(false)} />
    ), [availableFilters, addFilter]);

    const filterOptionsList = useMemo(() => (
        <OptionList options={availableFilterOptions} onClickOption={setFilterOption} onMouseEnter={() => setIsHoverFilters(true)} onMouseLeave={() => setIsHoverFilters(false)} />
    ), [availableFilterOptions, setFilterOption]);

    useLayoutEffect(() => {
        focusInSearch ? searchInput.current.focus() : searchInput.current.blur();
    });
    
    return (
        <div className={searchBoxWrapper}>
            <div className="flex justify-start items-center">
                <ul className="flex flex-nowrap">
                    {filters.map((filter, idx) => (
                        <FilterChip filter={filter} />
                    ))}
                </ul>
                <input ref={searchInput} className="w-full h-full p-2 bg-gray-50 outline-none" placeholder="Search through tags or text" onFocus={onFocusInSearch} onBlur={onFocusOutSearch} />
            </div>
            {focusInSearch && ( filterSelected ? filterOptionsList : filtersList )}
        </div>
    );
}

export default SearchBox;