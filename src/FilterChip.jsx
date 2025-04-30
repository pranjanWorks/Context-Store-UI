const FilterChip = ({ filter }) => {
    return (
        <div className="flex justify-start items-center bg-slate-600">
            <p className="whitespace-nowrap">{filter?.filter}: </p>
            {filter?.filterValue && (
                <p className="whitespace-nowrap">{filter?.filterValue}</p>
            )}
        </div>
    );
}

export default FilterChip;