import { useState } from "react"
import { AppContext, defaultAppContext } from "./AppContext"

export const AppContextProvider = ({ children }) => {
    const [appContext, setAppContext] = useState(defaultAppContext);

    /* ToDo */
    // Populate appContext with correct values through API call inside a useEffect

    return (
        <AppContext.Provider value={appContext}>
            {children}
        </AppContext.Provider>
    );
}