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
import { splitValueAndUnitFromSize } from './utils';

const FontSizePickerSelect = ( props: FontSizePickerSelectProps ) => {
	const { fontSizes = [], value, size, onChange, onSelectCustom } = props;

	const defaultOption: FontSizePickerSelectOption = {
		key: 'default',
		name: __( 'Default' ),
		value: undefined,
	};
	const customOption: FontSizePickerSelectOption = {
		key: 'custom',
		name: __( 'Custom' ),
	};
	const options: FontSizePickerSelectOption[] = [
		defaultOption,
		...fontSizes.map( ( fontSize ) => {
			const [ number ] = splitValueAndUnitFromSize( fontSize.size );
			return {
				key: fontSize.slug,
				name: fontSize.name ?? fontSize.slug,
				value: fontSize.size,
				__experimentalHint: number,
			};
		} ),
		customOption,
	];

	const selectedOption =
		options.find( ( option ) => option.value === value ) ?? customOption;

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
				if ( selectedItem === customOption ) {
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
