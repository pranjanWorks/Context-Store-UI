import { useEffect, useState } from "react"
import { AppContext, defaultAppContext } from "./AppContext"
import axios from "axios";

export const AppContextProvider = ({ children }) => {
    const [appContext, setAppContext] = useState(defaultAppContext);

    useEffect(() => {
        const setAgentsAndContacts = async () => {
            const res = await axios.get('http://127.0.0.1:5000/get_all_data');
            const data = res?.data?.results;
            const updatedAppContext = { ...appContext };
            updatedAppContext.agent = [ ...new Set(data.map(item => item?.metadata?.agent)) ];
            updatedAppContext.contact = [ ...new Set(data.map(item => item?.metadata?.contact)) ];
            setAppContext(updatedAppContext);
        }
        setAgentsAndContacts();
    }, []);

    return (
        <AppContext.Provider value={appContext}>
            {children}
        </AppContext.Provider>
    );
}