/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback, Text, Platform } from 'react-native';
/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const isIOS = Platform.OS === 'ios';

const Segment = ( { isSelected, title, onPress } ) => {
	const isSelectedIOS = isIOS && isSelected;

	const segmentStyle = [ styles.segment, isIOS && styles.segmentIOS ];
	const outlineStyle = [ styles.outline, isIOS && styles.outlineIOS ];

	// TODO: Support dark mode
	return (
		<View style={ isSelectedIOS && styles.shadowIOS }>
			<TouchableWithoutFeedback onPress={ onPress }>
				<View style={ [ segmentStyle, isSelected && styles.selected ] }>
					{ isSelected && <View style={ outlineStyle } /> }
					<Text
						style={ [
							styles.buttonTextDefault,
							isSelected && styles.buttonTextSelected,
						] }
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
} ) => {
	const [ activeSegment, setActiveSegment ] = useState( segments[ 0 ] );
	const containerStyle = [ styles.container, isIOS && styles.containerIOS ];

	function onHandlePress( item ) {
		setActiveSegment( item );
		segmentHandler( item );
	}

	return (
		<View style={ styles.row }>
			<View style={ { flex: 1 } }>{ addonLeft }</View>
			<View style={ containerStyle }>
				{ segments.map( ( segment ) => (
					<Segment
						title={ sprintf( __( '%s' ), segment ) }
						onPress={ () => onHandlePress( segment ) }
						isSelected={ activeSegment === segment }
						key={ segment }
					/>
				) ) }
			</View>
			<View style={ { flex: 1 } }>{ addonRight }</View>
		</View>
	);
};

export default SegmentedControls;
