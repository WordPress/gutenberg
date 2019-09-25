/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { BottomSheet, Icon } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { getBlockType } from '@wordpress/blocks';
import { create } from '@wordpress/rich-text';
import { Component } from '@wordpress/element';

/**
 * External dependencies
 */
import { flattenDeep } from 'lodash';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './document-outline.scss';
import ScrollToContext from './ScrollToContext';

class DocumentOutline extends Component {
	static contextType = ScrollToContext;

	constructor( props ) {
		super( props );
		this.renderItem = this.renderItem.bind( this );
	}

	onPressItem( clientId ) {
		const { onClose, onSelect } = this.props;

		onSelect( clientId );
		// scroll to
		this.context( clientId );
		onClose();
	}

	renderItem( { item, index } ) {
		const blockType = getBlockType( item.name );
		const title = getTitle( item, blockType.title );
		const { selectedIndex } = this.props;

		return (
			<TouchableOpacity
				style={ { paddingLeft: Math.max( item.level - 1, 0 ) * styles.iconContainer.width } }
				onPress={ () => {
					this.onPressItem( item.clientId );
				} }
			>
				<View style={ styles.rowContainer }>
					<View style={ styles.itemContainer }>
						{ ( item.level > 0 ) && <View style={ styles.iconContainer }><Icon size={ 20 } icon="subdirectory" fill={ styles.subdirectoryIcon.color } /></View> }
						<View style={ styles.iconContainer }><Icon size={ 24 } icon={ blockType.icon.src } fill={ styles.blockIcon.color } /></View>
						<Text style={ styles.title } ellipsizeMode="tail" numberOfLines={ 1 }>{ title }</Text>
					</View>
					{ selectedIndex === index &&
					( <Icon style={ styles.selectedIcon } icon="saved" size={ 24 } fill={ styles.selectedIcon.color } /> ) }
				</View>
			</TouchableOpacity>
		);
	}

	render() {
		const { isVisible, onClose, blockList, selectedIndex } = this.props;
		return (
			<BottomSheet
				isVisible={ isVisible }
				onClose={ onClose }
				title={ __( 'Document Outline' ) }
			>
				<FlatList
					style={ styles.flatlist }
					data={ blockList }
					initialScrollIndex={ selectedIndex }
					initialNumToRender={ 10 }
					getItemLayout={ ( data, index ) => (
						{ length: styles.rowContainer.height, offset: styles.rowContainer.height * index, index }
					) }
					renderItem={ this.renderItem }
					keyExtractor={ ( item ) => item.clientId }
				/>
			</BottomSheet>
		);
	}
}

const isTextBlock = ( blockName ) => blockName === 'core/heading' || blockName === 'core/paragraph';
const isQuote = ( blockName ) => blockName === 'core/quote';
const getTitle = ( item, blockTitle ) => {
	if ( isTextBlock( item.name ) ) {
		const { text } = create( {
			html: item.attributes.content,
		} );
		return text;
	}
	if ( isQuote( item.name ) ) {
		const { text } = create( {
			html: item.attributes.value,
		} );
		return text;
	}
	return blockTitle;
};

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

