/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CustomSelectControl from '../custom-select-control';
import type {
	FontSizePickerSelectProps,
	FontSizePickerSelectOption,
} from './types';
import { isSimpleCssValue } from './utils';

const DEFAULT_OPTION: FontSizePickerSelectOption = {
	key: 'default',
	name: __( 'Default' ),
	value: undefined,
};

const FontSizePickerSelect = ( props: FontSizePickerSelectProps ) => {
	const { __next40pxDefaultSize, fontSizes, value, size, onChange } = props;

	const options: FontSizePickerSelectOption[] = [
		DEFAULT_OPTION,
		...fontSizes.map( ( fontSize ) => {
			let hint;
			if ( isSimpleCssValue( fontSize.size ) ) {
				hint = String( fontSize.size );
			}
			return {
				key: fontSize.slug,
				name: fontSize.name || fontSize.slug,
				value: fontSize.size,
				hint,
			};
		} ),
	];

	const selectedOption =
		options.find( ( option ) => option.value === value ) ?? DEFAULT_OPTION;

	return (
		<CustomSelectControl
			__next40pxDefaultSize={ __next40pxDefaultSize }
			__shouldNotWarnDeprecated36pxSize
			className="components-font-size-picker__select"
			label={ __( 'Font size' ) }
			hideLabelFromVision
			describedBy={ sprintf(
				// translators: %s: Currently selected font size.
				__( 'Currently selected font size: %s' ),
				selectedOption.name
			) }
			options={ options }
			value={ selectedOption }
			showSelectedHint
			onChange={ ( {
				selectedItem,
			}: {
				selectedItem: FontSizePickerSelectOption;
			} ) => {
				onChange( selectedItem.value );
			} }
			size={ size }
		/>
	);
};

export default FontSizePickerSelect;
