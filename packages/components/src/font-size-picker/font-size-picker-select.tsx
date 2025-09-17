/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import CustomSelectControl from '../custom-select-control';
import type {
	FontSizePickerSelectProps,
	FontSizePickerSelectOption,
} from './types';
import { generateFontSizeHint } from './utils';

// Custom styled component to force line break between name and hint while keeping checkmark on the right
const StyledCustomSelectControl = styled( CustomSelectControl )`
	.components-custom-select-control__item {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.components-custom-select-control__item
		.components-custom-select-control__item-hint {
		display: block;
		margin-top: 2px;
		margin-left: 0;
		font-size: 12px;
		line-height: 1.2;
		width: 100%;
	}

	.components-custom-select-control__item
		.components-custom-select-control__item-hint::before {
		content: '';
		display: block;
		height: 0;
		margin-top: -2px;
	}
`;

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
		selectedSlug,
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

	const selectedOption = ( () => {
		if ( value === undefined ) {
			return DEFAULT_OPTION;
		}

		// If selectedSlug is provided, use it to find the exact option
		if ( selectedSlug ) {
			const optionBySlug = options.find(
				( option ) => option.key === selectedSlug
			);
			if ( optionBySlug ) {
				return optionBySlug;
			}
		}

		// Fallback to finding by value (size) - this is the current behavior
		return (
			options.find( ( option ) => option.value === value ) ??
			DEFAULT_OPTION
		);
	} )();

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
				onChange( selectedItem.value, selectedItem.key );
			} }
			size={ size }
		/>
	);
};

export default FontSizePickerSelect;
