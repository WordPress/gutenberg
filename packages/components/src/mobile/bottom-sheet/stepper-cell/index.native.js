/**
 * External dependencies
 */
import { AccessibilityInfo, View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from '../cell';
import Stepper from './stepper';
import styles from './style.scss';
import RangeTextInput from '../range-text-input';
import { toFixed } from '../../utils';

const STEP_DELAY = 200;
const DEFAULT_STEP = 1;

const isIOS = Platform.OS === 'ios';

class BottomSheetStepperCell extends Component {
	constructor( props ) {
		super( props );

		this.announceValue = this.announceValue.bind( this );
		this.onDecrementValue = this.onDecrementValue.bind( this );
		this.onDecrementValuePressIn =
			this.onDecrementValuePressIn.bind( this );
		this.onIncrementValue = this.onIncrementValue.bind( this );
		this.onIncrementValuePressIn =
			this.onIncrementValuePressIn.bind( this );
		this.onPressOut = this.onPressOut.bind( this );

		const { value, defaultValue, min } = props;

		const initialValue = value || defaultValue || min;

		this.state = {
			inputValue: initialValue,
			stepperValue: initialValue,
		};
	}

	componentWillUnmount() {
		clearTimeout( this.timeout );
		clearInterval( this.interval );
		clearTimeout( this.timeoutAnnounceValue );
	}

	onIncrementValue() {
		const { step, max, onChange, value, decimalNum } = this.props;
		let newValue = toFixed( value + step, decimalNum );
		newValue =
			parseInt( newValue ) === newValue ? parseInt( newValue ) : newValue;
		if ( newValue <= max || max === undefined ) {
			onChange( newValue );
			this.setState( {
				inputValue: newValue,
			} );
			this.announceValue( newValue );
		}
	}

	onDecrementValue() {
		const { step, min, onChange, value, decimalNum } = this.props;
		let newValue = toFixed( value - step, decimalNum );
		newValue =
			parseInt( newValue ) === newValue ? parseInt( newValue ) : newValue;
		if ( newValue >= min ) {
			onChange( newValue );
			this.setState( {
				inputValue: newValue,
			} );
			this.announceValue( newValue );
		}
	}

	onIncrementValuePressIn() {
		this.onIncrementValue();
		this.timeout = setTimeout( () => {
			this.startPressInterval( this.onIncrementValue );
		}, 500 );
	}

	onDecrementValuePressIn() {
		this.onDecrementValue();
		this.timeout = setTimeout( () => {
			this.startPressInterval( this.onDecrementValue );
		}, 500 );
	}

	onPressOut() {
		clearTimeout( this.timeout );
		clearInterval( this.interval );
	}

	startPressInterval( callback, speed = STEP_DELAY ) {
		let counter = 0;
		this.interval = setInterval( () => {
			callback();
			counter += 1;

			if ( counter === 10 ) {
				clearInterval( this.interval );
				this.startPressInterval( callback, speed / 2 );
			}
		}, speed );
	}

	announceValue( value ) {
		const { label, unitLabel = '' } = this.props;

		if ( isIOS ) {
			// On Android it triggers the accessibilityLabel with the value change
			clearTimeout( this.timeoutAnnounceValue );
			this.timeoutAnnounceValue = setTimeout( () => {
				AccessibilityInfo.announceForAccessibility(
					`${ value } ${ unitLabel } ${ label }`
				);
			}, 300 );
		}
	}

	render() {
		const {
			label,
			settingLabel = 'Value',
			unitLabel = '',
			icon,
			min,
			max,
			value,
			separatorType,
			children,
			shouldDisplayTextInput = false,
			preview,
			onChange,
			openUnitPicker,
			decimalNum,
			cellContainerStyle,
			disabled,
		} = this.props;
		const { inputValue } = this.state;
		const isMinValue = value === min;
		const isMaxValue = value === max;
		const labelStyle = [
			styles.cellLabel,
			! icon ? styles.cellLabelNoIcon : {},
		];

		const getAccessibilityHint = () => {
			return openUnitPicker ? __( 'double-tap to change unit' ) : '';
		};

		const accessibilityLabel = sprintf(
			/* translators: accessibility text. Inform about current value. 1: Control label. 2: setting label (example: width). 3: Current value. 4: value measurement unit (example: pixels) */
			__( '%1$s. %2$s is %3$s %4$s.' ),
			label,
			settingLabel,
			value,
			unitLabel
		);

		const containerStyle = [
			styles.rowContainer,
			isIOS ? styles.containerIOS : styles.containerAndroid,
		];

		return (
			<View
				accessible
				accessibilityRole="adjustable"
				accessibilityLabel={ accessibilityLabel }
				accessibilityHint={ getAccessibilityHint() }
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
							if ( openUnitPicker ) {
								openUnitPicker();
							}
							break;
					}
				} }
			>
				<View importantForAccessibility="no-hide-descendants">
					<Cell
						accessible={ false }
						cellContainerStyle={ [
							styles.cellContainerStyle,
							preview && styles.columnContainer,
							cellContainerStyle,
						] }
						cellRowContainerStyle={
							preview ? containerStyle : styles.cellRowStyles
						}
						editable={ false }
						icon={ icon }
						label={ label }
						labelStyle={ labelStyle }
						leftAlign
						separatorType={ separatorType }
						disabled={ disabled }
					>
						<View style={ preview && containerStyle }>
							{ preview }
							<Stepper
								isMaxValue={ isMaxValue }
								isMinValue={ isMinValue }
								onPressInDecrement={
									this.onDecrementValuePressIn
								}
								onPressInIncrement={
									this.onIncrementValuePressIn
								}
								onPressOut={ this.onPressOut }
								value={ value }
								shouldDisplayTextInput={
									shouldDisplayTextInput
								}
							>
								{ shouldDisplayTextInput && (
									<RangeTextInput
										label={ label }
										onChange={ onChange }
										defaultValue={ `${ inputValue }` }
										value={ value }
										min={ min }
										step={ 1 }
										decimalNum={ decimalNum }
									>
										{ children }
									</RangeTextInput>
								) }
							</Stepper>
						</View>
					</Cell>
				</View>
			</View>
		);
	}
}

BottomSheetStepperCell.defaultProps = {
	step: DEFAULT_STEP,
};

export default withPreferredColorScheme( BottomSheetStepperCell );
