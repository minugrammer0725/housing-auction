import {useLocation, useNavigate} from 'react-router-dom';
import {getAuth, signInWithPopup, GoogleAuthProvider} from 'firebase/auth';
import {doc, setDoc, getDoc, serverTimestamp} from 'firebase/firestore';
import {db} from '../firebase.config';
import { toast } from 'react-toastify';
import googleIcon from '../assets/svg/googleIcon.svg';

const OAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const onGoogleClick = async () => {
      try {
          const auth = getAuth();
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const user = result.user;
          
          // Check for user (Google user)
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          //If user exists, put in the db.
          if (!docSnap.exists()) {
              // then put user into db.
                // setDoc has 2 params. (doc, and the actual data we want to add into db)
                    // doc takes in 3 params (db, name of the collection, user id)
              await setDoc(doc(db, 'users', user.uid), {
                  name: user.displayName,
                  email: user.email,
                  timestamp: serverTimestamp(),                  
              })
          }
          // navigate to home after.
          navigate('/');

      } catch (error) {
          toast.error('Could not authorize using Google');
      }
  }

  return (
  <div className='socialLogin'>
      <p>Sign {location.pathname === '/sign-up' ? 'up' : 'in'} with </p>
      <button className="socialIconDiv" onClick={onGoogleClick}>
          <img className='socialIconImg' src={googleIcon} alt="google" />
      </button>
  </div>
  )

}

export default OAuth