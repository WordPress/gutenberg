/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	BASE_DEFAULT_VALUE,
	RESET_VALUE,
	STEP,
	SPIN_FACTOR,
	isLineHeightDefined,
} from './utils';

const LineHeightControl = ( {
	/** Start opting into the larger default height that will become the default size in a future version. */
	__next40pxDefaultSize = false,
	value: lineHeight,
	onChange,
	__unstableInputWidth = '60px',
	...otherProps
} ) => {
	const isDefined = isLineHeightDefined( lineHeight );

	const adjustNextValue = ( nextValue, wasTypedOrPasted ) => {
		// Set the next value without modification if lineHeight has been defined.
		if ( isDefined ) {
			return nextValue;
		}

		/**
		 * The following logic handles the initial spin up/down action
		 * (from an undefined value state) so that the next values are better suited for
		 * line-height rendering. For example, the first spin up should immediately
		 * go to 1.6, rather than the normally expected 0.1.
		 *
		 * Spin up/down actions can be triggered by keydowns of the up/down arrow keys,
		 * dragging the input or by clicking the spin buttons.
		 */
		const spin = STEP * SPIN_FACTOR;
		switch ( `${ nextValue }` ) {
			case `${ spin }`:
				// Increment by spin value.
				return BASE_DEFAULT_VALUE + spin;
			case '0': {
				// This means the user explicitly input '0', rather than using the
				// spin down action from an undefined value state.
				if ( wasTypedOrPasted ) {
					return nextValue;
				}
				// Decrement by spin value.
				return BASE_DEFAULT_VALUE - spin;
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
		const value = adjustNextValue( state.value, wasTypedOrPasted );
		return { ...state, value };
	};

	const value = isDefined ? lineHeight : RESET_VALUE;

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

	if (
		! __next40pxDefaultSize &&
		( otherProps.size === undefined || otherProps.size === 'default' )
	) {
		deprecated( `36px default size for wp.blockEditor.LineHeightControl`, {
			since: '6.8',
			version: '7.1',
			hint: 'Set the `__next40pxDefaultSize` prop to true to start opting into the new default size, which will become the default in a future version.',
		} );
	}

	return (
		<div className="block-editor-line-height-control">
			<NumberControl
				{ ...otherProps }
				__shouldNotWarnDeprecated36pxSize
				__next40pxDefaultSize={ __next40pxDefaultSize }
				__unstableInputWidth={ __unstableInputWidth }
				__unstableStateReducer={ stateReducer }
				onChange={ handleOnChange }
				label={ __( 'Line height' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				spinFactor={ SPIN_FACTOR }
				value={ value }
				min={ 0 }
				spinControls="custom"
			/>
		</div>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/line-height-control/README.md
 */
export default LineHeightControl;
