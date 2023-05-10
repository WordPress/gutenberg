/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useEditedEntityRecord from '../use-edited-entity-record';

export const useIsEditorLoading = () => {
	const { isLoaded: hasLoadedPost } = useEditedEntityRecord();

	const { hasResolvingSelectors } = useSelect( ( select ) => {
		return {
			hasResolvingSelectors: select( coreStore ).hasResolvingSelectors(),
		};
	} );
	const [ loaded, setLoaded ] = useState( false );
	const timeoutRef = useRef( null );

	useEffect( () => {
		if ( ! hasResolvingSelectors && ! loaded ) {
			clearTimeout( timeoutRef.current );

			/*
			 * We're using an arbitrary 1s timeout here to catch brief moments
			 * without any resolving selectors that would result in displaying
			 * brief flickers of loading state and loaded state.
			 *
			 * It's worth experimenting with different values, since this also
			 * adds 1s of artificial delay after loading has finished.
			 */
			timeoutRef.current = setTimeout( () => {
				setLoaded( true );
			}, 1000 );

			return () => {
				clearTimeout( timeoutRef.current );
			};
		}
	}, [ loaded, hasResolvingSelectors ] );

	return ! loaded || ! hasLoadedPost;
};
