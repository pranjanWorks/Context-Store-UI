const OptionItem = ({ name}) => {
    return (
        <div className="w-full p-2 hover:bg-gray-50 cursor-pointer rounded-md">
            <p>{name}</p>
        </div>
    );
}

export const OptionList = ({ options, onClickOption, onMouseEnter, onMouseLeave }) => {
    return (
        <div className="w-32 rounded-md border border-gray-300 mt-5" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <ul>
                {options.map((option, idx) => (
                    <li key={idx} onClick={() => {
                        onClickOption(option);
                    }}>
                        <OptionItem { ...option }/>
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default OptionList;