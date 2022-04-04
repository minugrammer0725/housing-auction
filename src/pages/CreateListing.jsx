import React, {useState, useEffect, useRef} from 'react'
import {getAuth, onAuthStateChanged, reauthenticateWithCredential} from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {addDoc, collection, serverTimestamp} from 'firebase/firestore';

import {db} from '../firebase.config';
// install uuid first via npm
import {v4 as uuidv4} from 'uuid';

import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { toHaveAttribute } from '@testing-library/jest-dom/dist/matchers';

const CreateListing = () => {
  const [geolocationEnabled, setGeolocationEnabled] = useState(false); // geo location. True -> use geolocation.
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'rent',
    name: '',
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: '',
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    images: {},
    latitude: 0,
    longitude: 0
  });

  // destructure formData for convenience
  const {type, name, bedrooms, bathrooms, parking, furnished, address, offer, regularPrice, discountedPrice, images, latitude, longitude} = formData;


  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setFormData({...formData, userRef: user.uid})
        } else {
          // no user, redirect.
          navigate('/sign-in');
        }
      })
    }

    return () => {
      isMounted.current = false;
    }
  }, [isMounted])


  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // error checking
    if (discountedPrice >= regularPrice) {
      setLoading(false);
      toast.error('Discounted Price needs to be LESS than Regular Price.');
      return;
    }

    if (images.length > 6) {  
      setLoading(false);
      toast.error('Max of 6 images');
      return;
    }

    // geolocation
    let geolocation = {}; // lat and long
    let location = ''; // address

    if (geolocationEnabled) {
      const response = await fetch('https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}');
      const data = await response.json();
      
      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0; // set to 0 if null
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0; // set to 0 if null
      location = data.status === 'ZERO_STATUS' ? 'undefined' : data.results[0]?.formatted_address;
      if (location === undefined  || location.includes('undefined')){
        setLoading(false);
        toast.error('Please Enter a correct address.');
        return;
      }

    } else {
      geolocation.lat = latitude;
      geolocation.lng = longitude;
    }

    // store images in firebase (along with textual info)
    // --------------------------------------------------------------------------------------------
    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage()
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`

        const storageRef = ref(storage, 'images/' + fileName)

        const uploadTask = uploadBytesResumable(storageRef, image)

        // copied from firebase doc
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused');
                break;
              case 'running':
                console.log('Upload is running');
                break;
            }
          }, 
          (error) => {
            // Handle unsuccessful uploads
            reject(error);
          }, 
          () => {
            // Handle successful uploads on complete
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );

      });
    }
    // --------------------------------------------------------------------------------------------

    const imgUrls = await Promise.all(
      [...images].map((image) => storeImage(image))
    ).catch(() => {
      setLoading(false)
      toast.error('Images not uploaded')
      return
    })

    // create listing object and upload to firebase! (form data + image)
    const formDataCopy = {
      ...formData,
      imgUrls,
      geolocation,
      timestamp: serverTimestamp()
    }

    // Clean up and Add data.
    delete formDataCopy.images
    delete formDataCopy.address
    if (location != '') {
      formDataCopy.location = location;
    }
    if (!formDataCopy.offer) {
      delete formDataCopy.discountedPrice
    }

    const docRef = await addDoc(collection(db, 'listings'), formDataCopy);

    setLoading(false);

    toast.success('Listing Saved!');
    
    navigate(`/category/${formDataCopy.type}/${docRef.id}`)

  }

  const onMutate = (e) => {
    let boolean = null; 

    if (e.target.value === 'true') { 
      boolean = true; 
    } else if  (e.target.value === 'false') { 
      boolean = false;
    }

    // Files
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files // array of images
      }))
    }
    
    // Text / Boolean / Numbers
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }))
    }

  }


  if (loading) {
    return <Spinner />
  }

  return (
    <div className='profile'>
      <header>
        <p className="pageHeader">Create a listing!</p>
      </header>
      <main>
        <form onSubmit={onSubmit}>
          {/* Type */ }
          <label className='formLabel'>Sell / Rent</label>
          <div className="formButtons">
            <button type='button' className={type === 'sale' ? 'formButtonActive' : 'formButton'} id='type' value='sale' onClick={onMutate}>
              Sell
            </button>
            <button type='button' className={type === 'rent' ? 'formButtonActive' : 'formButton'} id='type' value='rent' onClick={onMutate}>
              Rent
            </button>
          </div>

          {/* Name */ }
          <label className='formLabel'>Name</label>
          <input className='formInputName' type='text' id='name' value={name} onChange={onMutate} maxLength='32' minLength='10' required />
          
          {/* Bedrooms/Bathrooms */ }
          <div className='formRooms flex'>
            <div>
              <label className='formLabel'>Bedrooms</label>
              <input className='formInputSmall' type='number' id='bedrooms' value={bedrooms} onChange={onMutate} min='1' max='50' required />
            </div>
            <div>
              <label className='formLabel'>Bathrooms</label>
              <input className='formInputSmall' type='number' id='bathrooms' value={bathrooms} onChange={onMutate} min='1' max='50' required />
            </div>
          </div>

          {/* Parking Spot */ }
          <label className='formLabel'>Parking spot</label>
          <div className='formButtons'>
            <button className={parking ? 'formButtonActive' : 'formButton'} type='button' id='parking' value={true}
              onClick={onMutate} min='1' max='50'>
              Yes
            </button>
            <button className={ !parking && parking !== null ? 'formButtonActive' : 'formButton' } type='button' 
              id='parking' value={false} onClick={onMutate} >
              No
            </button>
          </div>

          {/* Furnished */ }
          <label className='formLabel'>Furnished</label>
            <div className='formButtons'>
              <button className={furnished ? 'formButtonActive' : 'formButton'} type='button' id='furnished'
                value={true} onClick={onMutate} >
                Yes
              </button>
              <button className={ !furnished && furnished !== null ? 'formButtonActive' : 'formButton' }
                type='button' id='furnished' value={false} onClick={onMutate} >
                No
              </button>
            </div>

          {/* Address + Optional Lat/Long input */ }
          <label className='formLabel'>Address</label>
          <textarea className='formInputAddress' type='text' id='address' value={address} onChange={onMutate} required/>

          {!geolocationEnabled && (
            <div className='formLatLng flex'>
              <div>
                <label className='formLabel'>Latitude</label>
                <input className='formInputSmall' type='number' id='latitude' value={latitude} onChange={onMutate} required />
              </div>
              <div>
                <label className='formLabel'>Longitude</label>
                <input className='formInputSmall' type='number' id='longitude' value={longitude} onChange={onMutate} required />
              </div>
            </div>
          )}
          
          {/* Offer */ }
          <label className='formLabel'>Offer</label>
          <div className='formButtons'>
            <button className={offer ? 'formButtonActive' : 'formButton'} type='button' id='offer' value={true} onClick={onMutate}>
              Yes
            </button>
            <button className={ !offer && offer !== null ? 'formButtonActive' : 'formButton' }
              type='button' id='offer' value={false} onClick={onMutate} >
              No
            </button>
          </div>

          {/* Regular Price */}
          <label className='formLabel'>Regular Price</label>
          <div className='formPriceDiv'>
            <input className='formInputSmall' type='number' id='regularPrice' value={regularPrice}
              onChange={onMutate} min='50' max='750000000' required/>
            {type === 'rent' && <p className='formPriceText'>$ / Month</p>}
          </div>

          {/* Discounted Price */}
          {offer && (
            <>
              <label className='formLabel'>Discounted Price</label>
              <input className='formInputSmall' type='number' id='discountedPrice' value={discountedPrice}
                onChange={onMutate} min='50' max='750000000' required={offer}/>
            </>
          )}

          {/* Image Upload (Max 6 images) */}
          <label className='formLabel'>Images</label>
          <p className='imagesInfo'>
            The first image will be the cover (max 6).
          </p>
          <input className='formInputFile' type='file' id='images' onChange={onMutate}
            max='6' accept='.jpg,.png,.jpeg' multiple required/>

          <button type='submit' className='primaryButton createListingButton'>
            Create Listing
          </button>

        </form>
      </main>

    </div>
  )
}

export default CreateListing