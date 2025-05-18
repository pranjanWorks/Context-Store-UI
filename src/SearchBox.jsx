import { useCallback, useState, useMemo, useRef, useLayoutEffect, useContext } from 'react';
import OptionList from './OptionList';
import FilterChip from './FilterChip';
import { AppContext } from './context';
import { resultsSample } from './mock';
import axios from 'axios';

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

    const searchRecords = useCallback(async () => {
        const metadata_filters = {};
        filters.forEach(filter => {
            if (filter?.filterValue) {
                metadata_filters[filter?.filter] = filter?.filterValue;
            }
        });
        const data = {
            query: searchText.current,
            metadata_filters
        };
        const res = (filters.length || searchText.current) ? 
                await axios.put('http://127.0.0.1:5000/search', data) : 
                await axios.get('http://127.0.0.1:5000/get_all_data');
        if (res?.data?.results?.length) {
            const rows = res?.data?.results.map(item => ({
                date: item?.metadata?.date,
                contact: item?.metadata?.contact,
                phone: item?.metadata?.phone,
                agent: item?.metadata?.agent,
                issue: item?.issue,
                resolution: [ ...item?.resolution ]
            }));
            setResults(rows);
        }
    }, [filters, setResults]);

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

    useLayoutEffect(() => {
        const eventHandler = async (event) => {
            const { type, payload } = event.data;
            console.log('===== event msg received =====', event);
            if (type === 'POPULATE_BY_ANI') {
                const metadata_filters = {
                    phone: payload?.aniE164 || payload?.ani
                }
                const res = await axios.put('http://127.0.0.1:5000/search', { metadata_filters });
                if (res?.data?.results?.length) {
                    const rows = res?.data?.results.map(item => ({
                        date: item?.metadata?.date,
                        contact: item?.metadata?.contact,
                        phone: item?.metadata?.phone,
                        agent: item?.metadata?.agent,
                        issue: item?.issue,
                        resolution: [ ...item?.resolution ]
                    }));
                    setResults(rows);
                }
            }
        }
        
        window.addEventListener('message', eventHandler);

        return () => {
          window.removeEventListener('message', eventHandler);
        }
      }, [setResults]);
    
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
                <button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 " onClick={searchRecords}>Search</button>
            </div>
        </div>
    );
}

export default SearchBox;