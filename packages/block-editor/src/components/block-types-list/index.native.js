/**
 * External dependencies
 */
import {
	Dimensions,
	FlatList,
	SectionList,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { BottomSheet, InserterButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MIN_COL_NUM = 3;

export default function BlockTypesList( {
	name,
	sections,
	onSelect,
	listProps,
	initialNumToRender = 3,
} ) {
	const [ numberOfColumns, setNumberOfColumns ] = useState( MIN_COL_NUM );
	const [ itemWidth, setItemWidth ] = useState();
	const [ maxWidth, setMaxWidth ] = useState();

	useEffect( () => {
		const dimensionsChangeSubscription = Dimensions.addEventListener(
			'change',
			onLayout
		);
		onLayout();
		return () => {
			dimensionsChangeSubscription.remove();
		};
	}, [] );

	function calculateItemWidth() {
		const { paddingLeft: itemPaddingLeft, paddingRight: itemPaddingRight } =
			InserterButton.Styles.modalItem;
		const { width } = InserterButton.Styles.modalIconWrapper;
		return width + itemPaddingLeft + itemPaddingRight;
	}

	function onLayout() {
		const columnStyle = styles[ 'block-types-list__column' ];
		const sumLeftRightPadding =
			columnStyle.paddingLeft + columnStyle.paddingRight;

		const bottomSheetWidth = BottomSheet.getWidth();
		const containerTotalWidth = bottomSheetWidth - sumLeftRightPadding;
		const itemTotalWidth = calculateItemWidth();

		const columnsFitToWidth = Math.floor(
			containerTotalWidth / itemTotalWidth
		);

		const numColumns = Math.max( MIN_COL_NUM, columnsFitToWidth );

		setNumberOfColumns( numColumns );
		setMaxWidth( containerTotalWidth / numColumns );

		if ( columnsFitToWidth < MIN_COL_NUM ) {
			const updatedItemWidth =
				( bottomSheetWidth - 2 * sumLeftRightPadding ) / MIN_COL_NUM;
			setItemWidth( updatedItemWidth );
		}
	}

	const contentContainerStyle = StyleSheet.flatten(
		listProps.contentContainerStyle
	);

	const renderSection = ( { item } ) => {
		return (
			<TouchableWithoutFeedback accessible={ false }>
				<FlatList
					data={ item.list }
					key={ `InserterUI-${ name }-${ numberOfColumns }` } // Re-render when numberOfColumns changes.
					numColumns={ numberOfColumns }
					ItemSeparatorComponent={ () => (
						<TouchableWithoutFeedback accessible={ false }>
							<View
								style={
									styles[ 'block-types-list__row-separator' ]
								}
							/>
						</TouchableWithoutFeedback>
					) }
					scrollEnabled={ false }
					renderItem={ renderListItem }
				/>
			</TouchableWithoutFeedback>
		);
	};

	const renderListItem = ( { item } ) => {
		return (
			<InserterButton
				item={ item }
				itemWidth={ itemWidth }
				maxWidth={ maxWidth }
				onSelect={ onSelect }
			/>
		);
	};

	const renderSectionHeader = ( { section: { metadata } } ) => {
		if ( ! metadata?.icon ) {
			return null;
		}

		return (
			<TouchableWithoutFeedback accessible={ false }>
				<View style={ styles[ 'block-types-list__section-header' ] }>
					{ metadata?.icon }
				</View>
			</TouchableWithoutFeedback>
		);
	};

	return (
		<SectionList
			onLayout={ onLayout }
			testID={ `InserterUI-${ name }` }
			keyboardShouldPersistTaps="always"
			sections={ sections }
			initialNumToRender={ initialNumToRender }
			keyExtractor={ ( item ) => item.id }
			renderItem={ renderSection }
			renderSectionHeader={ renderSectionHeader }
			{ ...listProps }
			contentContainerStyle={ {
				...contentContainerStyle,
				paddingBottom: Math.max(
					listProps.safeAreaBottomInset,
					contentContainerStyle.paddingBottom
				),
			} }
		/>
	);
}
