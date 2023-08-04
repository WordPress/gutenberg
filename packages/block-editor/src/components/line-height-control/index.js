/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { __ } from '@wordpress/i18n';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	BASE_DEFAULT_VALUE,
	RESET_VALUE,
	STEP,
	ROUNDING_STEP,
	isLineHeightDefined,
} from './utils';
import { roundClamp } from '../../../../components/src/utils/math';

const LineHeightControl = ( {
	value: lineHeight,
	onChange,
	/** Start opting into the new margin-free styles that will become the default in a future version. */
	__nextHasNoMarginBottom = false,
	__unstableInputWidth = '60px',
	...otherProps
} ) => {
	const min = 0;
	const max = Infinity;
	const isDefined = isLineHeightDefined( lineHeight );

	const adjustNextValue = ( nextValue, wasTypedOrPasted, wasOnBlur ) => {
		/**
		 * The following logic handles the rounding of values that have two decimals
		 * when the spin controls are used.
		 *
		 * For example, if the value is 1.25, the next value up should be 1.3, and the
		 * next value down should be 1.2.
		 */
		const valueHasTwoDecimals = /^\d+\.\d{2}$/.test( value.toString() );

		if ( valueHasTwoDecimals && ! wasTypedOrPasted && ! wasOnBlur ) {
			const valueWithOneDecimal = value.toString().slice( 0, -1 );
			if ( nextValue < value ) {
				return roundClamp( valueWithOneDecimal, min, max, STEP );
			}
			return roundClamp( value, min, max, STEP );
		}

		// Set the next value without modification if lineHeight has been defined.
		if ( isDefined ) return nextValue;

		/**
		 * The following logic handles the initial step up/down action
		 * (from an undefined value state) so that the next values are better suited for
		 * line-height rendering. For example, the first step up should immediately
		 * go to 1.6, rather than the normally expected 0.1.
		 *
		 * Step up/down actions can be triggered by keydowns of the up/down arrow keys,
		 * or by clicking the spin buttons.
		 */
		switch ( `${ nextValue }` ) {
			case `${ STEP }`:
				// Increment by step value.
				return BASE_DEFAULT_VALUE + STEP;
			case '0': {
				// This means the user explicitly input '0', rather than stepped down
				// from an undefined value state.
				if ( wasTypedOrPasted ) return nextValue;
				// Decrement by step value.
				return BASE_DEFAULT_VALUE - STEP;
			}
			case '':
				return BASE_DEFAULT_VALUE;
			default:
				return nextValue;
		}
	};

	const stateReducer = ( state, action ) => {
		// Be careful when changing this — cross-browser behavior of the
		// `inputType` field in `input` events are inconsistent.
		// For example, Firefox emits an input event with inputType="insertReplacementText"
		// on spin button clicks, while other browsers do not even emit an input event.
		const wasTypedOrPasted = [ 'insertText', 'insertFromPaste' ].includes(
			action.payload.event.nativeEvent?.inputType
		);
		const wasOnBlur = action.payload.event.type === 'blur';
		const value = adjustNextValue(
			state.value,
			wasTypedOrPasted,
			wasOnBlur
		);
		return { ...state, value };
	};

	const value = isDefined ? lineHeight : RESET_VALUE;

	if ( ! __nextHasNoMarginBottom ) {
		deprecated(
			'Bottom margin styles for wp.blockEditor.LineHeightControl',
			{
				since: '6.0',
				version: '6.4',
				hint: 'Set the `__nextHasNoMarginBottom` prop to true to start opting into the new styles, which will become the default in a future version',
			}
		);
	}
	const deprecatedStyles = __nextHasNoMarginBottom
		? undefined
		: { marginBottom: 24 };

	const handleOnChange = ( nextValue, { event } ) => {
		if ( nextValue === '' ) {
			onChange();
			return;
		}

		if ( event.type === 'click' ) {
			onChange( adjustNextValue( `${ nextValue }`, false ) );
			return;
		}

		onChange( `${ nextValue }` );
	};

	return (
		<div
			className="block-editor-line-height-control"
			style={ deprecatedStyles }
		>
			<NumberControl
				{ ...otherProps }
				__unstableInputWidth={ __unstableInputWidth }
				__unstableStateReducer={ stateReducer }
				onChange={ handleOnChange }
				label={ __( 'Line height' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ ROUNDING_STEP }
				spincrement={ STEP }
				value={ value }
				min={ min }
				max={ max }
				spinControls="custom"
			/>
		</div>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/line-height-control/README.md
 */
export default LineHeightControl;
