/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	TextControl,
	CustomSelectControl,
} from '@wordpress/components';
import { ZERO } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { RESET_VALUE, STEP } from './utils';

const DEFAULT_OPTION = {
	key: 'default',
	name: __( 'Default' ),
	value: undefined,
};
const CUSTOM_OPTION = {
	key: 'custom',
	name: __( 'Custom' ),
	value: 'custom',
};

export default function LineHeightControl( { presetValues, value, onChange } ) {
	const handleOnKeyDown = ( event ) => {
		const { keyCode } = event;

		if ( keyCode === ZERO ) {
			/**
			 * Prevents the onChange callback from firing, which prevents
			 * the logic from assuming the change was triggered from
			 * an input arrow CLICK.
			 */
			event.preventDefault();
			onChange( 0 );
		}
	};

	const handleOnChange = ( nextValue ) => onChange( Number( nextValue ) );

	const handlePresetSelection = ( { selectedItem } ) =>
		onChange( Number( selectedItem.value ) );

	const options = [
		DEFAULT_OPTION,
		...presetValues.map( ( presetValue ) => ( {
			key: presetValue.slug,
			name: presetValue.name,
			value: presetValue.value,
		} ) ),
	];

	return (
		<div className="block-editor-line-height-control">
			{ presetValues?.length > 0 && (
				<CustomSelectControl
					className={ 'block-editor-line-height-control__preset' }
					label={ __( 'Line Height' ) }
					options={ options }
					value={
						options.find( ( option ) => option.value === value ) ||
						CUSTOM_OPTION
					}
					onChange={ handlePresetSelection }
				/>
			) }
			<TextControl
				className={ 'block-editor-line-height-control__custom' }
				autoComplete="off"
				onKeyDown={ handleOnKeyDown }
				onChange={ handleOnChange }
				label={ __( 'Custom' ) }
				step={ STEP }
				type="number"
				value={ value || RESET_VALUE }
				min={ 0 }
			/>
			<Button
				className={ 'block-editor-line-height-control__reset' }
				disabled={ value === undefined }
				onClick={ () => onChange( undefined ) }
				isSmall
				isSecondary
			>
				{ __( 'Reset' ) }
			</Button>
		</div>
	);
}
