/**
 * External dependencies
 */
import { FlatList } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

export default function LinkPickerResults( {
	query,
	onLinkPicked,
	directEntry,
} ) {
	const [ links, setLinks ] = useState( [ directEntry ] );

	const { fetchLinkSuggestions } = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		return {
			fetchLinkSuggestions: getSettings()
				.__experimentalFetchLinkSuggestions,
		};
	}, [] );

	useEffect( () => {
		let isCancelled = false;

		fetchLinkSuggestions( query ).then( ( newLinks ) => {
			if ( ! isCancelled ) {
				setLinks( [ directEntry, ...newLinks ] );
			}
		} );

		return () => {
			isCancelled = true;
		};
	}, [ query ] );

	return (
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
		/>
	);
}
