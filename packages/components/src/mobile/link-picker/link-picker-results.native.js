/**
 * External dependencies
 */
import {
	ActivityIndicator,
	AppState,
	Clipboard,
	FlatList,
	View,
} from 'react-native';
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { BottomSheet, BottomSheetConsumer } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { isURL } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export const useAppState = () => {
	const [ state, setState ] = useState( AppState.currentState );

	useEffect( () => {
		const onChange = ( nextAppState ) => setState( nextAppState );
		const subscription = AppState.addEventListener( 'change', onChange );
		return () => subscription.remove();
	}, [] );

	return state;
};

const PER_PAGE = 20;
const REQUEST_DEBOUNCE_DELAY = 400;
const MINIMUM_QUERY_SIZE = 2;
const meetsThreshold = ( query ) => MINIMUM_QUERY_SIZE <= query.length;
const getURLFromClipboard = async () => {
	const text = await Clipboard.getString();
	return !! text && isURL( text ) ? text : '';
};

export default function LinkPickerResults( {
	query,
	onLinkPicked,
	directEntry,
} ) {
	const appState = useAppState();
	const [ clipboardLink, setClipboardLink ] = useState( {} );
	const { url: clipboardUrl } = clipboardLink;
	const initialSuggestions = !! query ? [ directEntry ] : [];
	const [ links, setLinks ] = useState( initialSuggestions );
	const [ hasAllSuggestions, setHasAllSuggestions ] = useState( false );
	const nextPage = useRef( 1 );
	const pendingRequest = useRef();
	const clearRequest = () => {
		pendingRequest.current = null;
	};
	const setClipboardUrl = ( url ) => {
		setClipboardLink( {
			type: 'clipboard',
			url,
			isDirectEntry: true,
			accessible: true,
			accessibilityLabel: sprintf(
				/* translators: Copy URL from the clipboard, https://sample.url */
				__( 'Copy URL from the clipboard, %s' ),
				url
			),
		} );
	};

	// a stable debounced function to fetch suggestions and append
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
			// return early if we've already detected the end of data or we are
			// already awaiting a response
			if ( hasAllSuggestions || pendingRequest.current ) {
				return;
			}
			const request = fetchLinkSuggestions( { search } );
			pendingRequest.current = request;
			const suggestions = await request;

			// only update links for the most recent request
			if ( suggestions && request === pendingRequest.current ) {
				// since we don't have the response header, we check if the results
				// are truncated to determine we've reached the end
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
	}, [] );

	// prevent setting state when unmounted
	useEffect( () => clearRequest, [] );

	// any time the query changes, we reset pagination
	useEffect( () => {
		clearRequest();
		nextPage.current = 1;
		setHasAllSuggestions( false );
		setLinks( initialSuggestions );
		fetchMoreSuggestions( { query, links: initialSuggestions } );
	}, [ query ] );

	useEffect( () => {
		if ( appState === 'active' ) {
			getURLFromClipboard()
				.then( ( url ) => setClipboardUrl( url ) )
				.catch( () => setClipboardUrl( '' ) );
		}
	}, [ appState ] );

	const onEndReached = () => fetchMoreSuggestions( { query, links } );

	const spinner = ! hasAllSuggestions && meetsThreshold( query ) && (
		<View style={ styles.spinner }>
			<ActivityIndicator animating />
		</View>
	);

	return (
		<BottomSheetConsumer>
			{ ( { listProps } ) => (
				<FlatList
					data={
						!! clipboardUrl && clipboardUrl !== query
							? [ clipboardLink, ...links ]
							: links
					}
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
					ListEmptyComponent={
						<View
							accessible={ true }
							accessibilityLabel={
								/* translators: No items. */
								__( 'No items.' )
							}
						/>
					}
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
