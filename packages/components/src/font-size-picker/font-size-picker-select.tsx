/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	FontSizePickerSelectProps,
	FontSizePickerSelectOption,
} from './types';
import { generateFontSizeHint } from './utils';
import { StyledCustomSelectControl } from './styles';

const DEFAULT_OPTION: FontSizePickerSelectOption = {
	key: 'default',
	name: __( 'Default' ),
	value: undefined,
};

const FontSizePickerSelect = ( props: FontSizePickerSelectProps ) => {
	const {
		__next40pxDefaultSize,
		fontSizes,
		value,
		size,
		valueMode = 'literal',
		onChange,
	} = props;

	const options: FontSizePickerSelectOption[] = [
		DEFAULT_OPTION,
		...fontSizes.map( ( fontSize ) => {
			const hint = generateFontSizeHint( fontSize );
			return {
				key: fontSize.slug,
				name: fontSize.name || fontSize.slug,
				value: fontSize.size,
				hint,
			};
		} ),
	];

	const selectedOption = useMemo( () => {
		if ( value === undefined ) {
			return DEFAULT_OPTION;
		}

		// If valueMode is 'slug', find by slug
		if ( valueMode === 'slug' ) {
			const optionBySlug = options.find(
				( option ) => option.key === value
			);
			if ( optionBySlug ) {
				return optionBySlug;
			}
		}

		// If valueMode is 'literal', find by value (size)
		return (
			options.find( ( option ) => option.value === value ) ??
			DEFAULT_OPTION
		);
	}, [ value, valueMode, options ] );

	return (
		<StyledCustomSelectControl
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
				// Find the corresponding FontSize object
				const matchingFontSize =
					selectedItem.key === 'default'
						? undefined
						: fontSizes.find(
								( fontSize ) =>
									fontSize.slug === selectedItem.key
						  );

				onChange( selectedItem.value, matchingFontSize );
			} }
			size={ size }
		/>
	);
};

export default FontSizePickerSelect;
