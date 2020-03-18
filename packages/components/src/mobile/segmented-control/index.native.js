/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback, Text, Platform } from 'react-native';
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
	const [ activeSegment, setActiveSegment ] = useState( segments[ 0 ] );
	const containerStyle = getStylesFromColorScheme(
		styles.container,
		styles.containerDark
	);

	function onHandlePress( item ) {
		setActiveSegment( item );
		segmentHandler( item );
	}

	return (
		<View style={ styles.row }>
			<View style={ { flex: 1 } }>{ addonLeft }</View>
			<View style={ [ containerStyle, isIOS && styles.containerIOS ] }>
				{ segments.map( ( segment ) => (
					<Segment
						title={ sprintf( __( '%s' ), segment ) }
						onPress={ () => onHandlePress( segment ) }
						isSelected={ activeSegment === segment }
						key={ segment }
						getStylesFromColorScheme={ getStylesFromColorScheme }
					/>
				) ) }
			</View>
			<View style={ { flex: 1 } }>{ addonRight }</View>
		</View>
	);
};

export default withPreferredColorScheme( SegmentedControls );
