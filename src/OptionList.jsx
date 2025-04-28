import { useMemo } from "react";

const OptionItem = ({ name }) => {
    return (
        <div className="w-full p-2 hover:bg-gray-50 cursor-pointer rounded-md">
            <p>{name}</p>
        </div>
    );
}

export const OptionList = () => {
    const options = useMemo(() => [
        { name: 'Disposition' },
        { name: 'Agent' },
        { name: 'Contact' },
        { name: 'Intent' }
    ], []);
    
    return (
        <div className="w-32 rounded-md border border-gray-300 mt-5">
            <ul>
                {options.map((option, idx) => (
                    <li key={idx}>
                        <OptionItem { ...option } />
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default OptionList;