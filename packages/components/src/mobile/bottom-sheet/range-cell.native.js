/**
 * External dependencies
 */
import { Platform, AccessibilityInfo, findNodeHandle } from 'react-native';
/**
 * WordPress dependencies
 */
import { _x, __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from './cell';
import Slider from '../slider';

export default function BottomSheetRangeCell( props ) {
	const {
		value,
		setAttributes,
		defaultValue,
		minimumValue = 0,
		maximumValue = 10,
		disabled,
		step = 1,
		minimumTrackTintColor = '#00669b',
		maximumTrackTintColor = Platform.OS === 'ios' ? '#e9eff3' : '#909090',
		thumbTintColor = Platform.OS === 'android' && '#00669b',
		attribute,
		...cellProps
	} = props;
	const [ accessible, onChangeAccessible ] = useState( true );

	const onChangeValue = ( initialValue ) => {
		let sliderValue = initialValue;
		if ( sliderValue < minimumValue ) {
			sliderValue = minimumValue;
		} else if ( sliderValue > maximumValue ) {
			sliderValue = maximumValue;
		}
		setAttributes( {
			[ attribute ]: sliderValue,
		} );
	};

	const onCellPress = () => {
		onChangeAccessible( false );
		if ( this.sliderRef ) {
			const reactTag = findNodeHandle( this.sliderRef );
			AccessibilityInfo.setAccessibilityFocus( reactTag );
		}
	};

	const accessibilityLabel =
	sprintf(
		/* translators: accessibility text. Inform about current value. %2$s: Current value. */
		_x( '%1$s. Current value is %2$s', 'Slider for picking a number inside a range' ),
		cellProps.label, value
	);

	return (
		<Cell
			{ ...cellProps }
			accessibilityRole={ 'none' }
			editable={ true }
			accessible={ accessible }
			onPress={ onCellPress }
			accessibilityLabel={ accessibilityLabel }
			accessibilityHint={
				/* translators: accessibility text (hint for focusing a slider) */
				__( 'Double tap to change the value using slider' )
			}
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
				accessible={ true }
			/>
		</Cell>
	);
}
