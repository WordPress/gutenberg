/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback, Text } from 'react-native';
/**
 * WordPress dependencies
 */
// import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const Segment = ( { isSelected, title, onPress } ) => {
	// TODO: Support dark mode
	return (
		<TouchableWithoutFeedback onPress={ onPress }>
			<View style={ [ styles.default, isSelected && styles.selected ] }>
				{ isSelected && <View style={ styles.outline } /> }
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
	);
};

const SegmentedControls = ( {
	segments,
	segmentHandler,
	addonLeft,
	addonRight,
} ) => {
	const [ activeSegment, setActiveSegment ] = useState( segments[ 0 ] );

	function onHandlePress( item ) {
		setActiveSegment( item );
		segmentHandler( item );
	}

	return (
		<View style={ styles.row }>
			<View style={ { flex: 1 } }>{ addonLeft }</View>
			<View style={ styles.container }>
				{ segments.map( ( segment ) => (
					<Segment
						title={ segment }
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
