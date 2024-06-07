/**
 * Internal dependencies
 */
import type { SizeControlBaseProps, Size } from '../size-control/types';

export type FontSizePickerProps = Omit<
	SizeControlBaseProps,
	'fallbackValue'
> & {
	/**
	 * If `true`, it will not be possible to choose a custom fontSize. The user
	 * will be forced to pick one of the pre-defined sizes passed in fontSizes.
	 *
	 * @default false
	 */
	disableCustomFontSizes?: boolean;
	/**
	 * If no value exists, this prop defines the starting position for the font
	 * size picker slider. Only relevant if `withSlider` is `true`.
	 */
	fallbackFontSize?: number;
	/**
	 * An array of font size objects. The object should contain properties size,
	 * name, and slug.
	 */
	fontSizes?: Size[];
};

export type FontSizePickerSelectProps = Pick<
	FontSizePickerProps,
	'value' | 'size'
> & {
	fontSizes: NonNullable< FontSizePickerProps[ 'fontSizes' ] >;
	disableCustomFontSizes: NonNullable<
		FontSizePickerProps[ 'disableCustomFontSizes' ]
	>;
	onChange: NonNullable< FontSizePickerProps[ 'onChange' ] >;
	onSelectCustom: () => void;
	__next40pxDefaultSize: boolean;
};

export type FontSizePickerSelectOption = {
	key: string;
	name: string;
	value?: Size[ 'size' ];
	__experimentalHint?: string;
};

export type FontSizePickerToggleGroupProps = Pick<
	FontSizePickerProps,
	'value' | 'size' | '__next40pxDefaultSize'
> & {
	fontSizes: NonNullable< FontSizePickerProps[ 'fontSizes' ] >;
	onChange: NonNullable< FontSizePickerProps[ 'onChange' ] >;
};
