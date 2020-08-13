/**
 * External dependencies
 */
import {
	View,
	TouchableWithoutFeedback,
	Text,
	Dimensions,
	Image,
} from 'react-native';
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

function StyleVariation( { onPress, isActive, style, url } ) {
	const [ itemWidth, setItemWidth ] = useState( MAX_ITEM_WIDTH );
	const { label, name } = style;

	function onLayout() {
		const columnsNum = Math.floor(
			BottomSheet.getWidth() / MAX_ITEM_WIDTH
		);
		setItemWidth( BottomSheet.getWidth() / ( columnsNum + 0.5 ) );
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

	return (
		<TouchableWithoutFeedback onPress={ onPress }>
			<View style={ styles.container }>
				<View style={ [ styles.imageWrapper, { width: itemWidth } ] }>
					{ isActive && (
						<View style={ [ styles.outline, styles[ name ] ] } />
					) }
					<Image
						style={ [ styles.image, styles[ name ] ] }
						source={ { uri: url } }
					/>
				</View>
				<Text style={ labelStyle }>{ label }</Text>
			</View>
		</TouchableWithoutFeedback>
	);
}

export default StyleVariation;
