/**
 * External dependencies
 */
import { FlatList, Text, TouchableHighlight, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { SVG, BottomSheet } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './style.scss';

class Inserter extends Component {
	render() {
		const numberOfColumns = this.calculateNumberOfColumns();
		const bottomPadding = this.props.addExtraBottomPadding && styles.contentBottomPadding;

		return (
			<BottomSheet
				isVisible={ true }
				onClose={ this.props.onDismiss }
				contentStyle={ [ styles.content, bottomPadding ] }
				hideHeader
			>
				<FlatList
					scrollEnabled={ false }
					key={ `InserterUI-${ numberOfColumns }` } //re-render when numberOfColumns changes
					keyboardShouldPersistTaps="always"
					numColumns={ numberOfColumns }
					data={ this.props.items }
					ItemSeparatorComponent={ () =>
						<View style={ styles.rowSeparator } />
					}
					keyExtractor={ ( item ) => item.name }
					renderItem={ ( { item } ) =>
						<TouchableHighlight
							style={ styles.touchableArea }
							underlayColor={ 'transparent' }
							activeOpacity={ .5 }
							accessibilityLabel={ item.title }
							onPress={ () => this.props.onValueSelected( item.name ) }>
							<View style={ styles.modalItem }>
								<View style={ styles.modalIconWrapper }>
									<View style={ styles.modalIcon }>
										{ this.iconWithUpdatedFillColor( styles.modalIcon.fill, item.icon ) }
									</View>
								</View>
								<Text style={ styles.modalItemLabel }>{ item.title }</Text>
							</View>
						</TouchableHighlight>
					}
				/>
			</BottomSheet>
		);
	}

	iconWithUpdatedFillColor( color, icon ) {
		return (
			<SVG viewBox={ icon.src.props.viewBox } xmlns={ icon.src.props.xmlns } style={ { fill: color } }>
				{ icon.src.props.children }
			</SVG>
		);
	}

	calculateNumberOfColumns() {
		const bottomSheetWidth = BottomSheet.getWidth();
		const { paddingLeft: itemPaddingLeft, paddingRight: itemPaddingRight } = styles.modalItem;
		const { paddingLeft: containerPaddingLeft, paddingRight: containerPaddingRight } = styles.content;
		const { width: itemWidth } = styles.modalIconWrapper;
		const itemTotalWidth = itemWidth + itemPaddingLeft + itemPaddingRight;
		const containerTotalWidth = bottomSheetWidth - ( containerPaddingLeft + containerPaddingRight );
		return Math.floor( containerTotalWidth / itemTotalWidth );
	}
}

export default compose( [
	withSelect( ( select, { clientId, isAppender, rootClientId } ) => {
		const {
			getInserterItems,
			getBlockName,
			getBlockRootClientId,
			getBlockSelectionEnd,
		} = select( 'core/block-editor' );
		const {
			getChildBlockNames,
		} = select( 'core/blocks' );

		let destinationRootClientId = rootClientId;
		if ( ! destinationRootClientId && ! clientId && ! isAppender ) {
			const end = getBlockSelectionEnd();
			if ( end ) {
				destinationRootClientId = getBlockRootClientId( end ) || undefined;
			}
		}
		const destinationRootBlockName = getBlockName( destinationRootClientId );
		const inserterItems = getInserterItems( destinationRootClientId );

		return {
			rootChildBlocks: getChildBlockNames( destinationRootBlockName ),
			items: inserterItems.filter( ( { name } ) => name !== getUnregisteredTypeHandlerName() ),
			destinationRootClientId,
		};
	} ),
] )( Inserter );
