import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

// do 'npm i react-toastify' first
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Explore from './pages/Explore';
import Offers from './pages/Offers';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<Explore/>} />
          <Route path='/offers' element={<Offers/>} />
          {/* Protected Route using children props.   */}
          <Route path='/profile' element = {<PrivateRoute> <Profile /> </PrivateRoute>} />
          <Route path='/sign-in' element={<SignIn/>} />
          <Route path='/sign-up' element={<SignUp/>} />
          <Route path='/forgot-password' element={<ForgotPassword/>} />
        </Routes>
        
        <Navbar />

      </Router>

      <ToastContainer />
      
    </>
  );
}

export default App;
