/**
 * External dependencies
 */
import {
	View,
	TouchableWithoutFeedback,
	Text,
	Dimensions,
	Animated,
	Easing,
	Image,
} from 'react-native';
/**
 * WordPress dependencies
 */
import { BottomSheet } from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MAX_ITEM_WIDTH = 120;

function StyleVariation( { onPress, isActive, style, url } ) {
	const [ itemWidth, setItemWidth ] = useState( MAX_ITEM_WIDTH );
	const { label, name } = style;
	const opacity = useRef( new Animated.Value( 1 ) ).current;

	function onLayout() {
		const columnsNum =
			Math.floor( BottomSheet.getWidth() / MAX_ITEM_WIDTH ) + 0.5;
		setItemWidth( BottomSheet.getWidth() / columnsNum );
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

	const animateOutline = () => {
		opacity.setValue( 0 );
		Animated.timing( opacity, {
			toValue: 1,
			duration: 100,
			useNativeDriver: true,
			easing: Easing.linear,
		} ).start();
	};

	return (
		<TouchableWithoutFeedback
			onPress={ () => {
				onPress();
				animateOutline();
			} }
		>
			<View style={ [ styles.container, { width: itemWidth } ] }>
				<View style={ styles.imageWrapper }>
					{ isActive && (
						<Animated.View
							style={ [
								styles.outline,
								{ opacity },
								styles[ name ],
							] }
						/>
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
