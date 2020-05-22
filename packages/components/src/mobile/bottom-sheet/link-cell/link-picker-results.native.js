/**
 * External dependencies
 */
import { FlatList } from 'react-native';
import { requestLinks } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from '../cell';

export default function LinkPickerResults( { query, onLinkPicked } ) {
	const [ links, setLinks ] = useState( [] );

	useEffect( () => {
		requestLinks( query, ( newLinks ) => {
			setLinks( newLinks );
		} );
	}, [ query ] );

	return (
		<FlatList
			data={ links }
			keyboardShouldPersistTaps="always"
			style={ { maxHeight: 250 } }
			renderItem={ ( { item: { url, title } } ) => (
				<Cell
					label={ title }
					onPress={ () => onLinkPicked( { url, title } ) }
				/>
			) }
			keyExtractor={ ( { url } ) => url }
		/>
	);
}
