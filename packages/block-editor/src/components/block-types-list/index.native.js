/**
 * External dependencies
 */
import {
	FlatList,
	View,
	TouchableWithoutFeedback,
	Dimensions,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { BottomSheet, InserterButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';
import styles from './style.scss';

const MIN_COL_NUM = 3;

export class BlockTypesList extends Component {
	constructor() {
		super( ...arguments );

		this.onLayout = this.onLayout.bind( this );
		this.renderItem = this.renderItem.bind( this );

		this.state = {
			numberOfColumns: MIN_COL_NUM,
		};

		Dimensions.addEventListener( 'change', this.onLayout );
	}

	componentWillUnmount() {
		Dimensions.removeEventListener( 'change', this.onLayout );
	}

	calculateMinItemWidth( bottomSheetWidth ) {
		const { paddingLeft, paddingRight } = styles.columnPadding;
		return (
			( bottomSheetWidth - 2 * ( paddingLeft + paddingRight ) ) /
			MIN_COL_NUM
		);
	}

	calculateItemWidth() {
		const {
			paddingLeft: itemPaddingLeft,
			paddingRight: itemPaddingRight,
		} = InserterButton.Styles.modalItem;
		const { width: itemWidth } = InserterButton.Styles.modalIconWrapper;
		return itemWidth + itemPaddingLeft + itemPaddingRight;
	}

	calculateColumnsProperties() {
		const bottomSheetWidth = BottomSheet.getWidth();
		const { paddingLeft, paddingRight } = styles.columnPadding;
		const itemTotalWidth = this.calculateItemWidth();
		const containerTotalWidth =
			bottomSheetWidth - ( paddingLeft + paddingRight );
		const numofColumns = Math.floor( containerTotalWidth / itemTotalWidth );

		if ( numofColumns < MIN_COL_NUM ) {
			return {
				numOfColumns: MIN_COL_NUM,
				itemWidth: this.calculateMinItemWidth( bottomSheetWidth ),
				maxWidth: containerTotalWidth / MIN_COL_NUM,
			};
		}
		return {
			numOfColumns: numofColumns,
			maxWidth: containerTotalWidth / numofColumns,
		};
	}

	onLayout() {
		const {
			numOfColumns,
			itemWidth,
			maxWidth,
		} = this.calculateColumnsProperties();
		const numberOfColumns = numOfColumns;

		this.setState( { numberOfColumns, itemWidth, maxWidth } );
	}

	renderItem( { item } ) {
		const { itemWidth, maxWidth } = this.state;
		const { onSelect } = this.props;
		return (
			<InserterButton
				item={ item }
				itemWidth={ itemWidth }
				maxWidth={ maxWidth }
				onSelect={ onSelect }
			/>
		);
	}

	render() {
		const { name, items, listProps } = this.props;
		const { numberOfColumns } = this.state;

		return (
			<FlatList
				onLayout={ this.onLayout }
				key={ `InserterUI-${ name }-${ numberOfColumns }` } //re-render when numberOfColumns changes
				keyboardShouldPersistTaps="always"
				numColumns={ numberOfColumns }
				data={ items }
				ItemSeparatorComponent={ () => (
					<TouchableWithoutFeedback accessible={ false }>
						<View style={ styles.rowSeparator } />
					</TouchableWithoutFeedback>
				) }
				keyExtractor={ ( item ) => item.name }
				renderItem={ this.renderItem }
				{ ...listProps }
			/>
		);
	}
}

export default BlockTypesList;
