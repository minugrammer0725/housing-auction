import React from 'react'
import {Navigate} from 'react-router-dom';
import Spinner from './Spinner';

// import custom hook
import { useAuthStatus } from '../hooks/useAuthStatus';

const PrivateRoute = ({children}) => {
    const { loggedIn, checkingStatus } = useAuthStatus();
    
    // Check to see if user is logged in. 
    // if loading, render a spinner. 
    if (checkingStatus) {
        return <Spinner />
    }

    return loggedIn ? children : <Navigate to='/sign-in' /> 

}


export default PrivateRoute