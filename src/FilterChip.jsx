import ClearIcon from '@mui/icons-material/Clear';

const TextContainer = ({ text }) => {
    return (
        <p className="whitespace-nowrap text-blue-900">{text}&nbsp;</p>
    );
}

const FilterChip = ({ filter, onClear }) => {
    return (
        <div className="flex justify-start items-center bg-blue-100 rounded-md p-1">
            <TextContainer text={`${filter?.filter}: `} />
            {filter?.filterValue && (
                <TextContainer text={filter?.filterValue} />
            )}
            <button onClick={onClear}>
                <ClearIcon fontSize='4px' />
            </button>
        </div>
    );
}

export default FilterChip;