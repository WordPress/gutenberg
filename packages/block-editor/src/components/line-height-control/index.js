/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { __ } from '@wordpress/i18n';
import {
	__experimentalNumberControl as NumberControl,
	TextControl,
} from '@wordpress/components';
import { ZERO } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	BASE_DEFAULT_VALUE,
	RESET_VALUE,
	STEP,
	isLineHeightDefined,
} from './utils';

// TODO: Remove before merging
export function LegacyLineHeightControl( { value: lineHeight, onChange } ) {
	const isDefined = isLineHeightDefined( lineHeight );

	const handleOnKeyDown = ( event ) => {
		const { keyCode } = event;

		if ( keyCode === ZERO && ! isDefined ) {
			/**
			 * Prevents the onChange callback from firing, which prevents
			 * the logic from assuming the change was triggered from
			 * an input arrow CLICK.
			 */
			event.preventDefault();
			onChange( '0' );
		}
	};

	const handleOnChange = ( nextValue ) => {
		// Set the next value without modification if lineHeight has been defined
		if ( isDefined ) {
			onChange( nextValue );
			return;
		}

		// Otherwise...
		/**
		 * The following logic handles the initial up/down arrow CLICK of the
		 * input element. This is so that the next values (from an undefined value state)
		 * are more better suited for line-height rendering.
		 */
		let adjustedNextValue = nextValue;

		switch ( nextValue ) {
			case `${ STEP }`:
				// Increment by step value
				adjustedNextValue = BASE_DEFAULT_VALUE + STEP;
				break;
			case '0':
				// Decrement by step value
				adjustedNextValue = BASE_DEFAULT_VALUE - STEP;
				break;
		}

		onChange( adjustedNextValue );
	};

	const value = isDefined ? lineHeight : RESET_VALUE;

	return (
		<div className="block-editor-line-height-control-legacy">
			<TextControl
				autoComplete="off"
				onKeyDown={ handleOnKeyDown }
				onChange={ handleOnChange }
				label={ __( 'Line height' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				type="number"
				value={ value }
				min={ 0 }
			/>
		</div>
	);
}

export default function LineHeightControl( {
	value: lineHeight,
	onChange,
	/** Start opting into the new margin-free styles that will become the default in a future version. */
	__nextHasNoMarginBottom = false,
	__unstableInputWidth = '60px',
} ) {
	const isDefined = isLineHeightDefined( lineHeight );
	const value = isDefined ? lineHeight : RESET_VALUE;

	if ( ! __nextHasNoMarginBottom ) {
		deprecated(
			'Bottom margin styles for wp.blockEditor.LineHeightControl',
			{
				since: '6.0',
				version: '6.4',
				hint:
					'Set the `__nextHasNoMarginBottom` prop to true to start opting into the new styles, which will become the default in a future version',
			}
		);
	}
	const deprecatedStyles = __nextHasNoMarginBottom
		? undefined
		: { marginBottom: 24 };

	return (
		<div
			className="block-editor-line-height-control"
			style={ deprecatedStyles }
		>
			<NumberControl
				__unstableInputWidth={ __unstableInputWidth }
				onChange={ onChange }
				label={ __( 'Line height' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				value={ value }
				min={ 0 }
			/>
		</div>
	);
}
