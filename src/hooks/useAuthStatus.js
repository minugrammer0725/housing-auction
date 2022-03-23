// reference from stack overflow.
// https://stackoverflow.com/questions/65505665/protected-route-with-firebase

import React, {useState, useEffect, useRef} from 'react'
import {getAuth, onAuthStateChanged} from 'firebase/auth';


export const useAuthStatus = () => {
    const [loggedIn ,setLoggedIn] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true); // loading state.

    const isMounted = useRef(true);

    useEffect(() => { 
        if (isMounted) {
            const auth = getAuth();
            // takes in auth, a function. 
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    setLoggedIn(true);
                }
                setCheckingStatus(false);
            })
        }

        return () => {
            isMounted.current = false;
        }
    }, [isMounted])

    return { loggedIn, checkingStatus };
}
