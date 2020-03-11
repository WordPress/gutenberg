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

const SegmentedControls = ( { segments, segmentHandler } ) => {
	const [ activeSegment, setActiveSegment ] = useState( 0 );

	function onHandlePress( index, item ) {
		setActiveSegment( index );
		segmentHandler( index, item );
	}

	return (
		<View style={ styles.container }>
			{ segments.map( ( segment, index ) => (
				<Segment
					title={ segment }
					onPress={ () => onHandlePress( index, segment ) }
					isSelected={ activeSegment === index }
					key={ index }
				/>
			) ) }
		</View>
	);
};

export default SegmentedControls;
