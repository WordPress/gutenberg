/**
 * External dependencies
 */
import { FlatList } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, BottomSheetConsumer } from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

const perPage = 20;

export default function LinkPickerResults( {
	query,
	onLinkPicked,
	directEntry,
} ) {
	const [ links, setLinks ] = useState( [ directEntry ] );
	const hasAllSuggestions = useRef( false );
	const nextPage = useRef( 1 );
	const pendingRequest = useRef();
	const clearRequest = () => ( pendingRequest.current = null );

	const { fetchLinkSuggestions } = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		return {
			fetchLinkSuggestions: async ( { query: search } ) =>
				await getSettings().__experimentalFetchLinkSuggestions(
					search,
					{ page: nextPage.current, perPage }
				),
		};
	}, [] );

	const fetchMoreSuggestions = async ( { currentSuggestions = links } ) => {
		// return early if we've already detected the end of data
		if ( pendingRequest.current || hasAllSuggestions.current ) {
			return;
		}
		const request = fetchLinkSuggestions( { query } );
		pendingRequest.current = request;
		const suggestions = await request;

		// only update links for the most recent request
		if ( request === pendingRequest.current ) {
			// since we don't have the response header, we check if the results
			// are truncated to determine we've reached the end
			if ( suggestions.length < perPage ) {
				hasAllSuggestions.current = true;
			}
			setLinks( [ ...currentSuggestions, ...suggestions ] );
			nextPage.current++;
		}

		clearRequest();
	};

	// prevent setting state when unmounted
	useEffect( () => clearRequest, [] );

	// any time the query changes, we reset pagination
	useEffect( () => {
		clearRequest();
		nextPage.current = 1;
		hasAllSuggestions.current = false;
		setLinks( [ directEntry ] );
		fetchMoreSuggestions( { currentSuggestions: [ directEntry ] } );
	}, [ query ] );

	return (
		<BottomSheetConsumer>
			{ ( { listProps } ) => (
				<FlatList
					data={ links }
					keyboardShouldPersistTaps="always"
					renderItem={ ( { item } ) => (
						<BottomSheet.LinkSuggestionItemCell
							suggestion={ item }
							onLinkPicked={ onLinkPicked }
						/>
					) }
					keyExtractor={ ( { url, type } ) => `${ url }-${ type }` }
					onEndReached={ fetchMoreSuggestions }
					onEndReachedThreshold={ 0.1 }
					initialNumToRender={ perPage }
					{ ...listProps }
				/>
			) }
		</BottomSheetConsumer>
	);
}
