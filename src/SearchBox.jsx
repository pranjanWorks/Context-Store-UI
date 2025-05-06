import { useCallback, useState, useMemo, useRef, useLayoutEffect, useContext } from 'react';
import OptionList from './OptionList';
import FilterChip from './FilterChip';
import { AppContext } from './context';
import { resultsSample } from './mock';

const SearchBox = ({ setResults }) => {
    const [focusInSearch, setFocusInSearch] = useState(false);
    const [filters, setFilters] = useState([]);
    const [isHoverFilters, setIsHoverFilters] = useState(false);
    const [renderToggle, setRenderToggle] = useState(false);
    const [filterSelected, setFilterSelected] = useState(null);
    const searchInput = useRef(null);
    const appContext = useContext(AppContext);
    const searchText = useRef("");
    
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

    const clearFilter = useCallback((idx) => {
        const updatedFilters = [ ...filters ];
        updatedFilters.splice(idx,1);
        setFilters(updatedFilters);
        if (idx === filters.length-1 && filterSelected) {
            setFilterSelected(null);
        }
    }, [filterSelected, filters]);

    const searchBoxWrapper = useMemo(() => 
        `relative w-full h-16 rounded-lg border border-gray-300 p-4 ${focusInSearch ? "ring-blue-500 border-blue-500" : ""}`, 
        [focusInSearch]
    );

    const availableFilters = useMemo(() => Object.keys(appContext).map(key => ({ name: key })), [appContext]);

    const availableFilterOptions = useMemo(() => {
        const filterOptions = filterSelected ? appContext[filterSelected.name] : [];
        return filterOptions.map(filterOption => ({ name: filterOption }));
    }, [filterSelected, appContext]);

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
            <div className="h-full flex justify-start items-start">
                <div className="h-full flex justify-start items-center">
                    <ul className="flex flex-nowrap space-x-1">
                        {filters.map((filter, idx) => (
                            <FilterChip filter={filter} onClear={() => clearFilter(idx)} />
                        ))}
                    </ul>
                </div>
                <div className="w-full">
                    <input ref={searchInput} className="w-full h-full p-2 outline-none" placeholder="Search through tags or text" onFocus={onFocusInSearch} onBlur={onFocusOutSearch} onChange={e => searchText.current=e.target.value} />
                    {focusInSearch && ( filterSelected ? filterOptionsList : filtersList )}
                </div>
                <button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 " onClick={() => setResults(resultsSample)}>Search</button>
            </div>
        </div>
    );
}

export default SearchBox;