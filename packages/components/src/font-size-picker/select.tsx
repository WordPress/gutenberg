/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CustomSelectControl from '../custom-select-control';
import { parseQuantityAndUnitFromRawValue } from '../unit-control';
import type {
	FontSizePickerSelectProps,
	FontSizePickerSelectOption,
} from './types';

const DEFAULT_OPTION: FontSizePickerSelectOption = {
	key: 'default',
	name: __( 'Default' ),
	value: undefined,
};

const CUSTOM_OPTION: FontSizePickerSelectOption = {
	key: 'custom',
	name: __( 'Custom' ),
};

const FontSizePickerSelect = ( props: FontSizePickerSelectProps ) => {
	const {
		fontSizes,
		value,
		disableCustomFontSizes,
		size,
		onChange,
		onSelectCustom,
	} = props;

	const options: FontSizePickerSelectOption[] = [
		DEFAULT_OPTION,
		...fontSizes.map( ( fontSize ) => {
			const [ quantity ] = parseQuantityAndUnitFromRawValue(
				fontSize.size
			);
			return {
				key: fontSize.slug,
				name: fontSize.name || fontSize.slug,
				value: fontSize.size,
				__experimentalHint:
					quantity !== undefined ? String( quantity ) : undefined,
			};
		} ),
		...( disableCustomFontSizes ? [] : [ CUSTOM_OPTION ] ),
	];

	const selectedOption =
		options.find( ( option ) => option.value === value ) ?? CUSTOM_OPTION;

	return (
		<CustomSelectControl
			__nextUnconstrainedWidth
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
			onChange={ ( {
				selectedItem,
			}: {
				selectedItem: FontSizePickerSelectOption;
			} ) => {
				if ( selectedItem === CUSTOM_OPTION ) {
					onSelectCustom();
				} else {
					onChange( selectedItem.value );
				}
			} }
			size={ size }
		/>
	);
};

export default FontSizePickerSelect;
