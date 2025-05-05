const SearchResultsTable = ({ results }) => {
    return (
        <div className="overflow-auto max-h-[400px]">
            <table className="w-full table-fixed text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3 w-[120px]">
                            Date
                        </th>
                        <th scope="col" className="px-6 py-3 w-[120px]">
                            User
                        </th>
                        <th scope="col" className="px-6 py-3 w-[140px]">
                            Agent
                        </th>
                        <th scope="col" className="px-6 py-3 w-50 w-[250px]">
                            Problem Description
                        </th>
                        <th scope="col" className="px-6 py-3 w-[250px]">
                            Problem Resolution
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {results?.map(result => (
                        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                            <td className="px-6 py-4">
                                {result?.date}
                            </td>
                            <td className="px-6 py-4">
                                {result?.user}
                            </td>
                            <td className="px-6 py-4">
                                {result?.agent}
                            </td>
                            <td className="px-6 py-4">
                                {result?.issue}
                            </td>
                            <td className="px-6 py-4 align-top">
                                <ul className="list-disc">
                                    {result?.resolution?.map(item => (
                                        <li>{item}</li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SearchResultsTable;