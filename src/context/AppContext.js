import { createContext } from "react";

export const defaultAppContext = {
    disposition: ['Resolved', 'Unresolved', 'Success', 'Failure'],
    agents: ['Pratyush', 'Yuvraj', 'Akshat', 'Keshav', 'Gautam'],
    contact: ['Ghanshyam', 'Vinod', 'Unnikrishnan', 'Manikanta'],
    intent: ['setup', 'warranty', 'insurance', 'cancellation']
}

export const AppContext = createContext(defaultAppContext);