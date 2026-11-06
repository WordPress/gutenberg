import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';
import type {
	LinkControlCreateSuggestionProp,
	LinkControlSuggestion,
} from './types';

interface CancelablePromise< T > {
	promise: Promise< T >;
	cancel: () => void;
}

export default function useCreatePage(
	handleCreatePage: LinkControlCreateSuggestionProp | undefined
) {
	const cancelableCreateSuggestion =
		useRef< CancelablePromise< LinkControlSuggestion > >( undefined );
	const [ isCreatingPage, setIsCreatingPage ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );

	const createPage = async function ( suggestionTitle?: string ) {
		setIsCreatingPage( true );
		setErrorMessage( null );

		try {
			// Make cancellable in order that we can avoid setting State
			// if the component unmounts during the call to `createSuggestion`
			cancelableCreateSuggestion.current = makeCancelable(
				// Using Promise.resolve to allow createSuggestion to return a
				// non-Promise based value.
				// LinkControl only offers creation when `createSuggestion` is set.
				Promise.resolve(
					handleCreatePage!( suggestionTitle as string )
				)
			);

			return await cancelableCreateSuggestion.current.promise;
		} catch ( error ) {
			// A rejection carries either the cancel marker or an error.
			if ( error && ( error as { isCanceled?: boolean } ).isCanceled ) {
				return; // bail if canceled to avoid setting state
			}

			setErrorMessage(
				( error as Error ).message ||
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
 * @param promise the Promise to make cancelable
 */
const makeCancelable = < T >(
	promise: Promise< T >
): CancelablePromise< T > => {
	let hasCanceled_ = false;

	const wrappedPromise = new Promise< T >( ( resolve, reject ) => {
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
