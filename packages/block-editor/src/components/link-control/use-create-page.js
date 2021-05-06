/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';

export default function useCreatePage( handleCreatePage ) {
	const cancelableCreateSuggestion = useRef();
	const [ isCreatingPage, setIsCreatingPage ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( null );

	const createPage = async function ( suggestionTitle ) {
		setIsCreatingPage( true );
		setErrorMessage( null );

		try {
			// Make cancellable in order that we can avoid setting State
			// if the component unmounts during the call to `createSuggestion`
			cancelableCreateSuggestion.current = makeCancelable(
				// Using Promise.resolve to allow createSuggestion to return a
				// non-Promise based value.
				Promise.resolve( handleCreatePage( suggestionTitle ) )
			);

			return await cancelableCreateSuggestion.current.promise;
		} catch ( error ) {
			if ( error && error.isCanceled ) {
				return; // bail if canceled to avoid setting state
			}

			setErrorMessage(
				error.message ||
					__(
						'An unknown error occurred during creation. Please try again.'
					)
			);
			throw error;
		} finally {
			setIsCreatingPage( false );
		}
	};

	/**
	 * Handles cancelling any pending Promises that have been made cancelable.
	 */
	useEffect( () => {
		return () => {
			// componentDidUnmount
			if ( cancelableCreateSuggestion.current ) {
				cancelableCreateSuggestion.current.cancel();
			}
		};
	}, [] );

	return {
		createPage,
		isCreatingPage,
		errorMessage,
	};
}

/**
 * Creates a wrapper around a promise which allows it to be programmatically
 * cancelled.
 * See: https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
 *
 * @param {Promise} promise the Promise to make cancelable
 */
const makeCancelable = ( promise ) => {
	let hasCanceled_ = false;

	const wrappedPromise = new Promise( ( resolve, reject ) => {
		promise.then(
			( val ) =>
				hasCanceled_ ? reject( { isCanceled: true } ) : resolve( val ),
			( error ) =>
				hasCanceled_ ? reject( { isCanceled: true } ) : reject( error )
		);
	} );

	return {
		promise: wrappedPromise,
		cancel() {
			hasCanceled_ = true;
		},
	};
};
