/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useEditedEntityRecord from '../use-edited-entity-record';

export function useIsSiteEditorLoading() {
	const { isLoaded: hasLoadedPost } = useEditedEntityRecord();
	const [ loaded, setLoaded ] = useState( false );
	const inLoadingPause = useSelect(
		( select ) => {
			const hasResolvingSelectors =
				select( coreStore ).hasResolvingSelectors();
			return ! loaded && ! hasResolvingSelectors;
		},
		[ loaded ]
	);

	useEffect( () => {
		if ( inLoadingPause ) {
			/*
			 * We're using an arbitrary 1s timeout here to catch brief moments
			 * without any resolving selectors that would result in displaying
			 * brief flickers of loading state and loaded state.
			 *
			 * It's worth experimenting with different values, since this also
			 * adds 1s of artificial delay after loading has finished.
			 */
			const timeout = setTimeout( () => {
				setLoaded( true );
			}, 1000 );

			return () => {
				clearTimeout( timeout );
			};
		}
	}, [ inLoadingPause ] );

	return ! loaded || ! hasLoadedPost;
}
