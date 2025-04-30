const TextContainer = ({ text }) => {
    return (
        <p className="whitespace-nowrap">{text}</p>
    );
}

const FilterChip = ({ filter }) => {
    return (
        <div className="flex justify-start items-center bg-slate-600">
            <TextContainer text={filter?.filter} />
            {filter?.filterValue && (
                <TextContainer text={filter?.filterValue} />
            )}
        </div>
    );
}

export default FilterChip;