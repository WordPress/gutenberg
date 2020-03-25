/**
 * External dependencies
 */
import {
	View,
	TouchableWithoutFeedback,
	Text,
	Platform,
	LayoutAnimation,
} from 'react-native';
/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const ANIMATION_DURATION = 300;

const isIOS = Platform.OS === 'ios';

const Segment = ( {
	isSelected,
	title,
	onPress,
	getStylesFromColorScheme,
} ) => {
	const isSelectedIOS = isIOS && isSelected;

	const segmentStyle = [ styles.segment, isIOS && styles.segmentIOS ];
	const outlineStyle = [ styles.outline, isIOS && styles.outlineIOS ];

	const selectedStyle = getStylesFromColorScheme(
		styles.selected,
		styles.selectedDark
	);
	const textStyle = getStylesFromColorScheme(
		styles.buttonTextDefault,
		styles.buttonTextDefaultDark
	);
	const selectedTextStyle = getStylesFromColorScheme(
		styles.buttonTextSelected,
		styles.buttonTextSelectedDark
	);
	const shadowStyle = getStylesFromColorScheme( styles.shadowIOS, {} );

	return (
		<View style={ isSelectedIOS && shadowStyle }>
			<TouchableWithoutFeedback onPress={ onPress }>
				<View style={ [ segmentStyle, isSelected && selectedStyle ] }>
					{ isSelected && <View style={ outlineStyle } /> }
					<Text
						style={ [ textStyle, isSelected && selectedTextStyle ] }
					>
						{ title }
					</Text>
				</View>
			</TouchableWithoutFeedback>
		</View>
	);
};

const SegmentedControls = ( {
	segments,
	segmentHandler,
	addonLeft,
	addonRight,
	getStylesFromColorScheme,
} ) => {
	const [ activeSegmentIndex, setActiveSegmentIndex ] = useState( 0 );
	const containerStyle = getStylesFromColorScheme(
		styles.container,
		styles.containerDark
	);

	function onHandlePress( segment, index ) {
		LayoutAnimation.configureNext(
			LayoutAnimation.create(
				ANIMATION_DURATION,
				LayoutAnimation.Types.easeInEaseOut,
				LayoutAnimation.Properties.opacity
			)
		);
		setActiveSegmentIndex( index );
		segmentHandler( segment );
	}

	return (
		<View style={ styles.row }>
			<View style={ styles.flex }>{ addonLeft }</View>
			<View style={ [ containerStyle, isIOS && styles.containerIOS ] }>
				{ segments.map( ( segment, index ) => {
					return (
						<Segment
							title={ sprintf( __( '%s' ), segment ) }
							onPress={ () => onHandlePress( segment, index ) }
							isSelected={ activeSegmentIndex === index }
							key={ index }
							getStylesFromColorScheme={
								getStylesFromColorScheme
							}
						/>
					);
				} ) }
			</View>
			<View style={ styles.flex }>{ addonRight }</View>
		</View>
	);
};

export default withPreferredColorScheme( SegmentedControls );
