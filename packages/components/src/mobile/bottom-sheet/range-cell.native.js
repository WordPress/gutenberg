/**
 * External dependencies
 */
import {
	Platform,
	AccessibilityInfo,
	findNodeHandle,
	View,
} from 'react-native';
import Slider from '@react-native-community/slider';

/**
 * WordPress dependencies
 */
import { _x, __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './range-cell.scss';
import RangeTextInput from './range-text-input';
import { toFixed } from '../utils';

const isIOS = Platform.OS === 'ios';

class BottomSheetRangeCell extends Component {
	constructor( props ) {
		super( props );
		this.onChangeValue = this.onChangeValue.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onCellPress = this.onCellPress.bind( this );

		const { value, defaultValue, minimumValue } = props;
		const initialValue = Number( value || defaultValue || minimumValue );

		this.state = {
			accessible: true,
			inputValue: initialValue,
			sliderValue: initialValue,
		};
	}

	onChangeValue( initialValue ) {
		const { decimalNum, onChange } = this.props;
		initialValue = toFixed( initialValue, decimalNum );
		this.setState( { inputValue: initialValue } );
		this.announceCurrentValue( `${ initialValue }` );
		onChange( initialValue );
	}

	onCellPress() {
		this.setState( { accessible: false } );
		if ( this.sliderRef ) {
			const reactTag = findNodeHandle( this.sliderRef );
			AccessibilityInfo.setAccessibilityFocus( reactTag );
		}
	}

	announceCurrentValue( value ) {
		/* translators: %s: current cell value. */
		const announcement = sprintf( __( 'Current value is %s' ), value );
		AccessibilityInfo.announceForAccessibility( announcement );
	}

	onChange( nextValue ) {
		const { onChange, onComplete } = this.props;
		this.setState( {
			sliderValue: nextValue,
		} );
		onChange( nextValue );
		if ( onComplete ) {
			onComplete( nextValue );
		}
	}

	render() {
		const {
			value,
			defaultValue,
			minimumValue = 0,
			maximumValue = 10,
			disabled,
			step = 1,
			preferredColorScheme,
			minimumTrackTintColor = preferredColorScheme === 'light'
				? '#00669b'
				: '#5198d9',
			maximumTrackTintColor = isIOS ? '#e9eff3' : '#909090',
			thumbTintColor = ! isIOS && '#00669b',
			preview,
			cellContainerStyle,
			onComplete,
			shouldDisplayTextInput = true,
			children,
			decimalNum,
			...cellProps
		} = this.props;

		const { accessible, inputValue, sliderValue } = this.state;

		const accessibilityLabel = sprintf(
			/* translators: accessibility text. Inform about current value. %1$s: Control label %2$s: Current value. */
			_x(
				'%1$s. Current value is %2$s',
				'Slider for picking a number inside a range'
			),
			cellProps.label,
			value
		);

		const containerStyle = [
			styles.container,
			isIOS ? styles.containerIOS : styles.containerAndroid,
		];

		return (
			<Cell
				{ ...cellProps }
				cellContainerStyle={ [
					styles.cellContainerStyles,
					cellContainerStyle,
				] }
				cellRowContainerStyle={ containerStyle }
				accessibilityRole={ 'none' }
				leftAlign
				editable={ false }
				activeOpacity={ 1 }
				accessible={ accessible }
				onPress={ this.onCellPress }
				valueStyle={ styles.valueStyle }
				accessibilityLabel={ accessibilityLabel }
				accessibilityHint={
					/* translators: accessibility text (hint for focusing a slider) */
					__( 'Double tap to change the value using slider' )
				}
			>
				<View style={ containerStyle }>
					{ preview }
					<Slider
						value={ sliderValue }
						defaultValue={ defaultValue }
						disabled={ disabled }
						step={ step }
						minimumValue={ minimumValue }
						maximumValue={ maximumValue }
						minimumTrackTintColor={ minimumTrackTintColor }
						maximumTrackTintColor={ maximumTrackTintColor }
						thumbTintColor={ thumbTintColor }
						onValueChange={ this.onChangeValue }
						onSlidingComplete={ onComplete }
						ref={ ( slider ) => {
							this.sliderRef = slider;
						} }
						style={
							isIOS ? styles.sliderIOS : styles.sliderAndroid
						}
						accessibilityRole={ 'adjustable' }
					/>
					{ shouldDisplayTextInput && (
						<RangeTextInput
							label={ cellProps.label }
							onChange={ this.onChange }
							defaultValue={ `${ inputValue }` }
							value={ inputValue }
							min={ minimumValue }
							max={ maximumValue }
							step={ step }
							decimalNum={ decimalNum }
						>
							{ children }
						</RangeTextInput>
					) }
				</View>
			</Cell>
		);
	}
}

export default withPreferredColorScheme( BottomSheetRangeCell );
