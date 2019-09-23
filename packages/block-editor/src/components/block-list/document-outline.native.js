/**
 * WordPress dependencies
 */
import { BottomSheet, Icon } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { getBlockType } from '@wordpress/blocks';

/**
 * External dependencies
 */
import { flattenDeep } from 'lodash';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './document-outline.scss';

const DocumentOutline = ( { isVisible, onClose, onSelect, clientId, blockList, selectedIndex } ) => (
	<BottomSheet
		isVisible={ isVisible }
		onClose={ onClose }
		title="Document Outline"
	>
		<FlatList
			style={ styles.flatlist }
			data={ blockList }
			initialScrollIndex={ selectedIndex }
			initialNumToRender={ 10 }
			getItemLayout={ ( data, index ) => (
				{ length: styles.rowContainer.height, offset: styles.rowContainer.height * index, index }
			) }
			renderItem={ ( { item } ) => {
				const blockType = getBlockType( item.name );
				return (
					<TouchableOpacity
						style={ { paddingLeft: Math.max( item.level - 1, 0 ) * styles.iconContainer.width } }
						onPress={ () => {
							onSelect( item.clientId );
							onClose();
						} }
					>
						<View style={ styles.rowContainer }>
							<View style={ styles.itemContainer }>
								{ ( item.level > 0 ) && <View style={ styles.iconContainer }><Icon size={ 18 } icon="subdirectory" /></View> }
								<View style={ styles.iconContainer }><Icon size={ 18 } icon={ blockType.icon.src } /></View>
								<Text>{ blockType.title }</Text>
							</View>
							{ item.clientId === clientId &&
							( <Icon icon="saved" fill={ styles.selectedIcon.color } size={ 20 } /> ) }
						</View>
					</TouchableOpacity>
				);
			} }
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
	withSelect( ( select, { clientId } ) => {
		const {
			getBlocks,
		} = select( 'core/block-editor' );
		const blockList = flatBlocks( getBlocks() );
		const selectedIndex = blockList.findIndex( ( block ) => block.clientId === clientId );
		return {
			blockList,
			selectedIndex,
		};
	} ),
] )( DocumentOutline );

