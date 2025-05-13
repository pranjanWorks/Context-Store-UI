import { createContext } from "react";

export const defaultAppContext = {
    disposition: ['Resolved', 'Unresolved', 'Success', 'Failure'],
    agent: [],
    contact: [],
    intent: ['setup', 'warranty', 'insurance', 'cancellation']
}

export const AppContext = createContext(defaultAppContext);