/**
 * External dependencies
 */
import { Platform, AccessibilityInfo, View } from 'react-native';
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
		this.onIncrementValue = this.onIncrementValue.bind( this );
		this.onDecrementValue = this.onDecrementValue.bind( this );

		const { value, defaultValue, minimumValue } = props;
		const initialValue = Number( value || defaultValue || minimumValue );

		this.state = {
			accessible: true,
			inputValue: initialValue,
			sliderValue: initialValue,
		};
	}

	componentWillUnmount() {
		clearTimeout( this.timeoutAnnounceValue );
	}

	onChangeValue( initialValue ) {
		const { decimalNum, onChange } = this.props;
		initialValue = toFixed( initialValue, decimalNum );
		this.setState( { inputValue: initialValue } );
		onChange( initialValue );
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

	onIncrementValue() {
		const { step = 10, maximumValue, decimalNum } = this.props;
		const { sliderValue } = this.state;

		const newValue = toFixed( sliderValue + step, decimalNum );

		if ( newValue <= maximumValue || maximumValue === undefined ) {
			this.onChangeValue( newValue );
			this.setState( {
				sliderValue: newValue,
			} );
			this.announceValue( newValue );
		}
	}

	onDecrementValue() {
		const { step = 10, minimumValue, decimalNum } = this.props;
		const { sliderValue } = this.state;

		const newValue = toFixed( sliderValue - step, decimalNum );

		if ( newValue >= minimumValue ) {
			this.onChangeValue( newValue );
			this.setState( {
				sliderValue: newValue,
			} );
			this.announceValue( newValue );
		}
	}

	announceValue( value ) {
		const { label, unitLabel = '' } = this.props;

		if ( Platform.OS === 'ios' ) {
			// On Android it triggers the accessibilityLabel with the value change
			clearTimeout( this.timeoutAnnounceValue );
			this.timeoutAnnounceValue = setTimeout( () => {
				AccessibilityInfo.announceForAccessibility(
					`${ value } ${ unitLabel },  ${ label }`
				);
			}, 300 );
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
			unitLabel = '',
			openUnitPicker,
			children,
			decimalNum,
			...cellProps
		} = this.props;

		const { inputValue, sliderValue } = this.state;

		const accessibilityLabel = openUnitPicker
			? sprintf(
					/* translators: accessibility text. Inform about current value. %1$s: Control label %2$s: Current value. */
					_x(
						'%1$s. Current value is %2$s %3$s. Swipe up or down to adjust, double-tap to change unit',
						'Slider for picking a number inside a range'
					),
					cellProps.label,
					value,
					unitLabel
			  )
			: sprintf(
					/* translators: accessibility text. Inform about current value. %1$s: Control label %2$s: Current value. */
					_x(
						'%1$s. Current value is %2$s %3$s. Swipe up or down to adjust',
						'Slider for picking a number inside a range'
					),
					cellProps.label,
					value,
					unitLabel
			  );

		const containerStyle = [
			styles.container,
			isIOS ? styles.containerIOS : styles.containerAndroid,
		];

		return (
			<View
				accessible={ true }
				accessibilityRole="adjustable"
				accessibilityActions={ [
					{ name: 'increment' },
					{ name: 'decrement' },
					{ name: 'activate' },
				] }
				onAccessibilityAction={ ( event ) => {
					switch ( event.nativeEvent.actionName ) {
						case 'increment':
							this.onIncrementValue();
							break;
						case 'decrement':
							this.onDecrementValue();
							break;
						case 'activate':
							openUnitPicker();
							break;
					}
				} }
				accessibilityLabel={ accessibilityLabel }
			>
				<Cell
					{ ...cellProps }
					cellContainerStyle={ [
						styles.cellContainerStyles,
						cellContainerStyle,
					] }
					cellRowContainerStyle={ containerStyle }
					accessibilityRole={ 'adjustable' }
					leftAlign
					editable={ false }
					activeOpacity={ 1 }
					accessible={ false }
					valueStyle={ styles.valueStyle }
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
			</View>
		);
	}
}

export default withPreferredColorScheme( BottomSheetRangeCell );
