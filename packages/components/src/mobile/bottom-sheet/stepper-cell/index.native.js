/**
 * External dependencies
 */
import { AccessibilityInfo } from 'react-native';

/**
 * WordPress dependencies
 */
import { _x, __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from '../cell';
import Stepper from './stepper';

const STEP_SPEED = 200;

class BottomSheetStepperCell extends Component {
	constructor( props ) {
		super( props );

		this.onIncrementValue = this.onIncrementValue.bind( this );
		this.onDecrementValue = this.onDecrementValue.bind( this );
		this.onPressOut = this.onPressOut.bind( this );
		this.startPressInterval = this.startPressInterval.bind( this );
		this.onIncrementValuePressIn = this.onIncrementValuePressIn.bind( this );
		this.onDecrementValuePressIn = this.onDecrementValuePressIn.bind( this );

		this.state = {
			value: props.minValue,
		};
	}

	componentWillUnmount() {
		clearTimeout( this.timeout );
		clearInterval( this.interval );
	}

	onChangeStepperValue( value ) {
		const { onChangeValue } = this.props;

		onChangeValue( value );
		AccessibilityInfo.announceForAccessibility( this.getCurrentValueLabel() );
	}

	onIncrementValue() {
		const { value } = this.state;
		const { step, maxValue } = this.props;
		const newValue = value + step;

		if ( newValue <= maxValue ) {
			this.setState( { value: newValue } );
			this.onChangeStepperValue( newValue );
		}
	}

	onDecrementValue() {
		const { value } = this.state;
		const { step, minValue } = this.props;
		const newValue = value - step;

		if ( newValue >= minValue ) {
			this.setState( { value: newValue } );
			this.onChangeStepperValue( newValue );
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

	startPressInterval( callback ) {
		let i = 0;
		this.interval = setInterval( () => {
			callback();
			i += 1;

			if ( i === 10 ) {
				clearInterval( this.interval );
				this.startPressInterval( callback, STEP_SPEED / 2 );
			}
		}, STEP_SPEED );
	}

	getCurrentValueLabel() {
		const { value } = this.state;
		const { label } = this.props;

		return 	sprintf(
			/* translators: accessibility text. Inform about current value. %1$s: Control label %2$s: Current value. */
			_x( '%1$s. Current value is %2$s', 'Increase or decrement to change the value' ),
			label, value
		);
	}

	render() {
		const { value } = this.state;
		const { label, icon, minValue, maxValue } = this.props;
		const isMinValue = value === minValue;
		const isMaxValue = value === maxValue;

		return (
			<Cell
				label={ label }
				icon={ icon }
				accessibilityRole={ 'none' }
			>
				<Stepper
					accessible={ true }
					accessibilityHint={
						/* translators: accessibility text (hint for focusing a step value control) */
						__( 'Double tap to change the value using the step controls' )
					}
					accessibilityLabel={ this.getCurrentValueLabel() }
					accessibilityValue={ {
						max: maxValue,
						min: minValue,
						now: value,
					} }
					isMaxValue={ isMaxValue }
					isMinValue={ isMinValue }
					onPressInDecrement={ this.onDecrementValuePressIn }
					onPressInIncrement={ this.onIncrementValuePressIn }
					onPressOut={ this.onPressOut }
					value={ value }
				/>
			</Cell>
		);
	}
}

export default BottomSheetStepperCell;
