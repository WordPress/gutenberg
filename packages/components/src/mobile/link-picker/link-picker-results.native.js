/**
 * External dependencies
 */
import { ActivityIndicator, FlatList, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { debounce } from '@wordpress/compose';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import BottomSheet from '../bottom-sheet';
import { BottomSheetConsumer } from '../bottom-sheet/bottom-sheet-context';

const PER_PAGE = 20;
const REQUEST_DEBOUNCE_DELAY = 400;
const MINIMUM_QUERY_SIZE = 2;
const meetsThreshold = ( query ) => MINIMUM_QUERY_SIZE <= query.length;

export default function LinkPickerResults( {
	query,
	onLinkPicked,
	directEntry,
} ) {
	const [ links, setLinks ] = useState( [ directEntry ] );
	const [ hasAllSuggestions, setHasAllSuggestions ] = useState( false );
	const nextPage = useRef( 1 );
	const pendingRequest = useRef();
	const clearRequest = () => {
		pendingRequest.current = null;
	};

	// A stable debounced function to fetch suggestions and append.
	const { fetchMoreSuggestions } = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		const fetchLinkSuggestions = async ( { search } ) => {
			if ( meetsThreshold( search ) ) {
				return await getSettings().__experimentalFetchLinkSuggestions(
					search,
					{ page: nextPage.current, type: 'post', perPage: PER_PAGE }
				);
			}
		};
		const fetchMore = async ( {
			query: search,
			links: currentSuggestions,
		} ) => {
			// Return early if we've already detected the end of data or we are
			// already awaiting a response.
			if ( hasAllSuggestions || pendingRequest.current ) {
				return;
			}
			const request = fetchLinkSuggestions( { search } );
			pendingRequest.current = request;
			const suggestions = await request;

			// Only update links for the most recent request.
			if ( suggestions && request === pendingRequest.current ) {
				// Since we don't have the response header, we check if the results
				// are truncated to determine we've reached the end.
				if ( suggestions.length < PER_PAGE ) {
					setHasAllSuggestions( true );
				}
				setLinks( [ ...currentSuggestions, ...suggestions ] );
				nextPage.current++;
			}

			clearRequest();
		};
		return {
			fetchMoreSuggestions: debounce( fetchMore, REQUEST_DEBOUNCE_DELAY ),
		};
		// Disable eslint rule for now, to avoid introducing a regression
		// (see https://github.com/WordPress/gutenberg/pull/23922#discussion_r1170634879).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Prevent setting state when unmounted.
	useEffect( () => clearRequest, [] );

	// Any time the query changes, we reset pagination.
	useEffect( () => {
		clearRequest();
		nextPage.current = 1;
		setHasAllSuggestions( false );
		setLinks( [ directEntry ] );
		fetchMoreSuggestions( { query, links: [ directEntry ] } );
		// Disable reason: deferring this refactor to the native team.
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ query ] );

	const onEndReached = () => fetchMoreSuggestions( { query, links } );

	const spinner = ! hasAllSuggestions && meetsThreshold( query ) && (
		<View style={ styles.spinner } testID="link-picker-loading">
			<ActivityIndicator animating />
		</View>
	);

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
					onEndReached={ onEndReached }
					onEndReachedThreshold={ 0.1 }
					initialNumToRender={ PER_PAGE }
					ListFooterComponent={ spinner }
					{ ...listProps }
					contentContainerStyle={ [
						...listProps.contentContainerStyle,
						styles.list,
					] }
				/>
			) }
		</BottomSheetConsumer>
	);
}
