/**
 * External dependencies
 */
import { AccessibilityInfo, View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from '../cell';
import Stepper from './stepper';
import styles from './style.scss';

const STEP_SPEED = 200;
const DEFAULT_STEP = 1;

class BottomSheetStepperCell extends Component {
	constructor( props ) {
		super( props );

		this.announceValue = this.announceValue.bind( this );
		this.onDecrementValue = this.onDecrementValue.bind( this );
		this.onDecrementValuePressIn = this.onDecrementValuePressIn.bind( this );
		this.onIncrementValue = this.onIncrementValue.bind( this );
		this.onIncrementValuePressIn = this.onIncrementValuePressIn.bind( this );
		this.onPressOut = this.onPressOut.bind( this );
		this.startPressInterval = this.startPressInterval.bind( this );
	}

	componentWillUnmount() {
		clearTimeout( this.timeout );
		clearInterval( this.interval );
		clearTimeout( this.timeoutAnnounceValue );
	}

	onIncrementValue() {
		const { step, maxValue, onChangeValue, value } = this.props;
		const newValue = value + step;

		if ( newValue <= maxValue ) {
			onChangeValue( newValue );
			this.announceValue( newValue );
		}
	}

	onDecrementValue() {
		const { step, minValue, onChangeValue, value } = this.props;
		const newValue = value - step;

		if ( newValue >= minValue ) {
			onChangeValue( newValue );
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

	startPressInterval( callback ) {
		let counter = 0;
		this.interval = setInterval( () => {
			callback();
			counter += 1;

			if ( counter === 10 ) {
				clearInterval( this.interval );
				this.startPressInterval( callback, STEP_SPEED / 2 );
			}
		}, STEP_SPEED );
	}

	announceValue( value ) {
		const { label } = this.props;

		if ( Platform.OS === 'ios' ) { // On Android it triggers the accessibilityLabel with the value change
			clearTimeout( this.timeoutAnnounceValue );
			this.timeoutAnnounceValue = setTimeout( () => {
				AccessibilityInfo.announceForAccessibility( `${ value } ${ label }` );
			}, 300 );
		}
	}

	render() {
		const { label, icon, minValue, maxValue, value, separatorType } = this.props;
		const isMinValue = value === minValue;
		const isMaxValue = value === maxValue;

		const accessibilityLabel = sprintf(
			/* translators: accessibility text. Inform about current value. %1$s: Control label %2$s: Current value. */
			__( '%1$s. Current value is %2$s' ),
			label, value
		);

		return (
			<View
				accessible={ true }
				accessibilityRole="adjustable"
				accessibilityLabel={ accessibilityLabel }
				accessibilityActions={ [
					{ name: 'increment' },
					{ name: 'decrement' },
				] }
				onAccessibilityAction={ ( event ) => {
					switch ( event.nativeEvent.actionName ) {
						case 'increment':
							this.onIncrementValue();
							break;
						case 'decrement':
							this.onDecrementValue();
							break;
					}
				} }>
				<Cell
					accessibilityRole="none"
					accessible={ false }
					cellContainerStyle={ styles.cellContainerStyles }
					cellRowContainerStyle={ styles.cellRowStyles }
					disabled={ true }
					editable={ false }
					icon={ icon }
					label={ label }
					labelStyle={ styles.cellLabel }
					separatorType={ separatorType }
				>
					<Stepper
						isMaxValue={ isMaxValue }
						isMinValue={ isMinValue }
						onPressInDecrement={ this.onDecrementValuePressIn }
						onPressInIncrement={ this.onIncrementValuePressIn }
						onPressOut={ this.onPressOut }
						value={ value }
					/>
				</Cell>
			</View>
		);
	}
}

BottomSheetStepperCell.defaultProps = {
	step: DEFAULT_STEP,
};

export default BottomSheetStepperCell;
