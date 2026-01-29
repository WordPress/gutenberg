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
const HALF_COLUMN = 0.5;

function StylePreview( { onPress, isActive, style, url } ) {
	const [ itemWidth, setItemWidth ] = useState( MAX_ITEM_WIDTH );
	const { label, name } = style;
	const opacity = useRef( new Animated.Value( 1 ) ).current;

	function onLayout() {
		const columnsNum =
			// To indicate scroll availability, there is a need to display additional half the column.
			Math.floor( BottomSheet.getWidth() / MAX_ITEM_WIDTH ) + HALF_COLUMN;
		setItemWidth( BottomSheet.getWidth() / columnsNum );
	}

	useEffect( () => {
		onLayout();
		const dimensionsChangeSubscription = Dimensions.addEventListener(
			'change',
			onLayout
		);

		return () => {
			dimensionsChangeSubscription.remove();
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

	const innerOutlineStyle = usePreferredColorSchemeStyle(
		styles.innerOutline,
		styles.innerOutlineDark
	);

	const getOutline = ( outlineStyles ) =>
		outlineStyles.map( ( outlineStyle, index ) => {
			return (
				<Animated.View
					style={ [ outlineStyle, { opacity }, styles[ name ] ] }
					key={ index }
				/>
			);
		} );

	return (
		<TouchableWithoutFeedback
			onPress={ () => {
				onPress();
				animateOutline();
			} }
		>
			<View style={ [ styles.container, { width: itemWidth } ] }>
				<View style={ styles.imageWrapper }>
					{ isActive &&
						getOutline( [ styles.outline, innerOutlineStyle ] ) }
					<Image
						style={ [ styles.image, styles[ name ] ] }
						source={ { uri: url } }
					/>
				</View>
				<Text
					style={ [ labelStyle, isActive && styles.labelSelected ] }
				>
					{ label }
				</Text>
			</View>
		</TouchableWithoutFeedback>
	);
}

export default StylePreview;
