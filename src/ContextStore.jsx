import { useMemo } from "react";
import SearchResultsTable from "./SearchResultsTable";

const ContextStore = () => {
    const results = useMemo(() => ([
        {
          date: '12/10/2024',
          user: 'John Doe',
          agent: 'Michael Brown',
          issue: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.',
          resolution: [
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system'
          ]
        },
        {
          date: '12/10/2024',
          user: 'John Doe',
          agent: 'Michael Brown',
          issue: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.',
          resolution: [
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system'
          ]
        },
        {
          date: '12/10/2024',
          user: 'John Doe',
          agent: 'Michael Brown',
          issue: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.',
          resolution: [
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system'
          ]
        },
        {
          date: '12/10/2024',
          user: 'John Doe',
          agent: 'Michael Brown',
          issue: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.',
          resolution: [
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system'
          ]
        },
        {
          date: '12/10/2024',
          user: 'John Doe',
          agent: 'Michael Brown',
          issue: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.',
          resolution: [
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system',
            'Restart your system Restart your system Restart your system Restart your system'
          ]
        },
      ]), []);

      return (
        <div className="h-screen w-full p-4 flex justify-center items-center">
            <SearchResultsTable results={results} />
        </div>
      );
};

export default ContextStore;