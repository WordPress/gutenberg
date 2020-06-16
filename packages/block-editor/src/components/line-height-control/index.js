/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl, CustomSelectControl } from '@wordpress/components';
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

export default function LineHeightControl( {
	presetValues,
	value: lineHeight,
	onChange,
} ) {
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

	const options = presetValues.map( ( presetValue ) => ( {
		key: presetValue.slug,
		name: presetValue.name,
		value: presetValue.value,
	} ) );

	const handlePresetSelection = ( { selectedItem } ) =>
		onChange( selectedItem.value );

	return (
		<div className="block-editor-line-height-control">
			{ presetValues?.length > 0 && (
				<CustomSelectControl
					className={ 'block-editor-line-height-control__preset' }
					label={ __( 'Line Height' ) }
					options={ options }
					value={ options.find(
						( option ) => option.value === value
					) }
					onChange={ handlePresetSelection }
				/>
			) }
			<TextControl
				className={ 'block-editor-line-height-control__custom' }
				autoComplete="off"
				onKeyDown={ handleOnKeyDown }
				onChange={ handleOnChange }
				label={ __( 'Custom' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				type="number"
				value={ value }
				min={ 0 }
			/>
		</div>
	);
}
