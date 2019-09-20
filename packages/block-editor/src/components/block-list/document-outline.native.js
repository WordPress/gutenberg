/**
 * WordPress dependencies
 */
import { BottomSheet } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
/**
 * External dependencies
 */
import { flattenDeep } from 'lodash';
import { FlatList } from 'react-native';

const DocumentOutline = ( { isVisible, onClose, onSelect, clientId, blockList } ) => (
	<BottomSheet
		isVisible={ isVisible }
		onClose={ onClose }
		title="Document Outline"
	>
		<FlatList
			style={ { height: 300 } }
			data={ blockList }
			renderItem={ ( { item } ) => (
				<BottomSheet.Cell
					icon={ 'editor-textcolor' }
					label={ item.name }
					onPress={ () => {
						onSelect( item.clientId );
						onClose();
					} }
					separatorType={ 'none' }
				/>
			) }
			keyExtractor={ ( item ) => item.clientId + clientId }
		/>
	</BottomSheet>
);

const flatBlocks = ( blocks = [] ) => flattenDeep( flat( blocks, 0 ) );

const flat = ( block, level ) => {
	if ( Array.isArray( block ) ) {
		return block.map( ( el ) => flat( el, level ) );
	}
	if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
		return [ { ...block, level }, ...flat( block.innerBlocks, level + 1 ).flat() ];
	}
	return { ...block, level };
};

export default compose( [
	withSelect( ( select ) => {
		const {
			getBlocks,
		} = select( 'core/block-editor' );
		const blockList = flatBlocks( getBlocks() );
		return {
			blockList,
		};
	} ),
] )( DocumentOutline );

