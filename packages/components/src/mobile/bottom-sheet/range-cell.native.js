/**
 * External dependencies
 */
import { Platform, AccessibilityInfo, findNodeHandle } from 'react-native';
/**
 * WordPress dependencies
 */
import { sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from './cell';
import Slider from '../slider';

export default function BottomSheetRangeCell( props ) {
	const {
		value,
		defaultValue,
		onChangeValue,
		minimumValue = 0,
		maximumValue = 10,
		disabled,
		step = 1,
		minimumTrackTintColor = '#00669b',
		maximumTrackTintColor = Platform.OS === 'ios' ? '#e9eff3' : '#909090',
		thumbTintColor = Platform.OS === 'android' && '#00669b',
		...cellProps
	} = props;
	const [ accessible, onChangeAccessible ] = useState( true );

	const onCellPress = () => {
		onChangeAccessible( false );
		if ( this.sliderRef ) {
			const reactTag = findNodeHandle( this.sliderRef );
			AccessibilityInfo.setAccessibilityFocus( reactTag );
		}
	};

	return (
		<Cell
			{ ...cellProps }
			accessibilityRole={ 'none' }
			editable={ true }
			accessible={ accessible }
			onPress={ onCellPress }
			accessibilityHint={ sprintf( 'Current value is %s pixels. Double tap to edit this value.', value ) }
		>
			<Slider
				value={ value }
				defaultValue={ defaultValue }
				disabled={ disabled }
				step={ step }
				minimumValue={ minimumValue }
				maximumValue={ maximumValue }
				minimumTrackTintColor={ minimumTrackTintColor }
				maximumTrackTintColor={ maximumTrackTintColor }
				thumbTintColor={ thumbTintColor }
				onChangeValue={ onChangeValue }
				ref={ ( slider ) => {
					this.sliderRef = slider;
				} }
				accessibilityRole={ 'adjustable' }
			/>
		</Cell>
	);
}
