/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { ZERO } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	BASE_DEFAULT_VALUE,
	RESET_VALUE,
	STEP,
	isLetterSpacingDefined,
} from './utils';

export default function LetterSpacingControl( {
	value: letterSpacing,
	onChange,
} ) {
	const isDefined = isLetterSpacingDefined( letterSpacing );

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

	const value = isDefined ? letterSpacing : RESET_VALUE;

	return (
		<div className="block-editor-line-height-control">
			<TextControl
				autoComplete="off"
				onKeyDown={ handleOnKeyDown }
				onChange={ handleOnChange }
				label={ __( 'Letter spacing' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				type="number"
				value={ value }
				min={ 0 }
			/>
		</div>
	);
}
