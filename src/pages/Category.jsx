import React, {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
// firestore
import {collection, getDocs, query, where, orderBy, limit, startAfter} from 'firebase/firestore' ;
import {db} from '../firebase.config';
import {toast} from 'react-toastify';
import Spinner from '../components/Spinner';

import ListingItem from '../components/ListingItem';

const Category = () => {

  // Hooks
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);

  const params = useParams();

  useEffect( () => {
    // since we are using async await... we need to create a function and then CALL IT. 
    const fetchListings = async () => {
      try {
        // Get a reference
        const listingsRef = collection(db, 'listings');
        
        // Create a query
          // Note that 'categoryName' is referenced in the App.js 
        const q = query(listingsRef, 
          where('type', '==', params.categoryName), 
          orderBy('timestamp', 'desc'),
          limit(10)
        )  
        
        // Execute Query
        const querySnap = await getDocs(q);
        const listings = [];

        querySnap.forEach((doc) => {
          return listings.push({
            id: doc.id,
            data: doc.data()
          })
        })

        // using use State hook
        setListings(listings)
        setLoading(false);

      } catch (error) {
        toast.error('Could not fetch listings')
      }
    }

    fetchListings(); 
  }, [params.categoryName])

  return (    
    <div className='category'>
      <header>
        <p className='pageHeader'>
          {params.categoryName === 'rent' ? 'Places for rent' : 'Places for sale'}
        </p>
      </header> 
      {loading ? <Spinner /> : (listings && listings.length > 0 ? (
      <>
        <main>
          <ul className='categoryListings'>
            {listings.map((listing) => (
              <ListingItem listing={listing.data} id={listing.id} key={listing.id} /> 
            ))}
          </ul>
        </main>
      </>
        
       )
       : <p>No listings for {params.categoryName}</p>)} 
    </div>
  )
}

export default Category