/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback, Text, Dimensions } from 'react-native';
/**
 * WordPress dependencies
 */
import { BottomSheet } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MAX_ITEM_WIDTH = 120;

function StyleVariation( { onPress, isActive, style } ) {
	const [ itemWidth, setItemWidth ] = useState( MAX_ITEM_WIDTH );
	const { label, name } = style;

	function onLayout() {
		const columnsNum = BottomSheet.getWidth() / MAX_ITEM_WIDTH;
		setItemWidth( `${ 100 / columnsNum }%` );
	}

	useEffect( () => {
		onLayout();
		Dimensions.addEventListener( 'change', onLayout );

		return () => {
			Dimensions.removeEventListener( 'change', onLayout );
		};
	}, [] );

	const labelStyle = usePreferredColorSchemeStyle(
		styles.label,
		styles.labelDark
	);

	const placeholderStyle = usePreferredColorSchemeStyle(
		styles.placeholder,
		styles.placeholderDark
	);

	const activeStyle = usePreferredColorSchemeStyle(
		styles.active,
		styles.activeDark
	);

	return (
		<TouchableWithoutFeedback onPress={ onPress }>
			<View
				style={ [
					styles.container,
					{ flexGrow: 1, width: itemWidth, maxWidth: MAX_ITEM_WIDTH },
				] }
			>
				<View
					style={ [
						placeholderStyle,
						isActive && activeStyle,
						styles[ name ],
					] }
				/>
				<Text style={ labelStyle }>{ label }</Text>
			</View>
		</TouchableWithoutFeedback>
	);
}

export default StyleVariation;
