const TextContainer = ({ text }) => {
    return (
        <p className="whitespace-nowrap text-blue-900">{text}&nbsp;</p>
    );
}

const FilterChip = ({ filter }) => {
    return (
        <div className="flex justify-start items-center bg-blue-100 rounded-md p-1">
            <TextContainer text={`${filter?.filter}: `} />
            {filter?.filterValue && (
                <TextContainer text={filter?.filterValue} />
            )}
        </div>
    );
}

export default FilterChip;