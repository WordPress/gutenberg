/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { addQueryArgs } from '@wordpress/url';
import { useRef } from '@wordpress/element';

export default function useFallback() {
	const isFetching = useRef( false );
	const { receiveEntityRecords } = useDispatch( coreStore );

	return async function () {
		if ( isFetching?.current ) {
			return;
		}

		isFetching.current = true;

		const fallback = await apiFetch( {
			path: addQueryArgs( '/wp-block-editor/v1/navigation-fallback', {
				_embed: true,
			} ),
		} );

		const record = fallback?._embedded?.self;

		if ( record ) {
			receiveEntityRecords( 'postType', 'wp_navigation', record );
		}

		isFetching.current = false;

		return fallback?.id;
	};
}
