/**
 * External dependencies
 */
import type { Key, MouseEventHandler, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type Popover from '../popover';
import type { HeadingSize } from '../heading/types';

export type Color = {
	color: string;
	name: string;
	slug: string;
	gradient?: never;
};

export type Gradient = {
	gradient: string;
	name: string;
	slug: string;
	color?: never;
};

export type PaletteElement = Color | Gradient;

export type BasePaletteEdit = {
	/**
	 * Whether the user can only change the color or gradient values.
	 * If true, they cannot change names or delete values.
	 *
	 * @default false
	 */
	canOnlyChangeValues?: boolean;
	/**
	 * Whether the user can reset the editor.
	 *
	 * @default false
	 */
	canReset?: boolean;
	/**
	 * A message to show if there's nothing to edit.
	 */
	emptyMessage?: string;
	/**
	 * A heading label for the palette.
	 */
	paletteLabel: string;
	/**
	 * An optional icon displayed before the palette label.
	 */
	paletteIcon?: ReactNode;
	/**
	 * The label's heading level.
	 *
	 * @default 2
	 */
	paletteLabelHeadingLevel?: HeadingSize;
	/**
	 * The prefix for the element slug.
	 *
	 * @default ''
	 */
	slugPrefix?: string;
	/**
	 * Props to pass through to the underlying Popover component.
	 */
	popoverProps?: Omit<
		React.ComponentPropsWithoutRef< typeof Popover >,
		'children'
	>;
};

export type PaletteEditColorVariation = {
	/**
	 * Whether this variation can be reset.
	 */
	canReset?: boolean;
	/**
	 * The colors in this variation.
	 */
	colors: Color[];
	gradients?: never;
	/**
	 * Runs on changing the variation.
	 */
	onChange: ( values?: Color[] ) => void;
	/**
	 * An optional icon displayed before the variation label.
	 */
	paletteIcon?: ReactNode;
	/**
	 * A heading label for the variation.
	 */
	paletteLabel: string;
};

export type PaletteEditGradientVariation = {
	/**
	 * Whether this variation can be reset.
	 */
	canReset?: boolean;
	colors?: never;
	/**
	 * The gradients in this variation.
	 */
	gradients: Gradient[];
	/**
	 * Runs on changing the variation.
	 */
	onChange: ( values?: Gradient[] ) => void;
	/**
	 * An optional icon displayed before the variation label.
	 */
	paletteIcon?: ReactNode;
	/**
	 * A heading label for the variation.
	 */
	paletteLabel: string;
};

type PaletteEditColors = {
	/**
	 * The colors in the palette.
	 */
	colors?: Color[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( values?: Color[] ) => void;
	gradients?: never;
	/**
	 * Related color variations edited from the same palette controls.
	 */
	paletteVariations?: PaletteEditColorVariation[];
};

type PaletteEditGradients = {
	/**
	 * The gradients in the palette.
	 */
	gradients: Gradient[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( values?: Gradient[] ) => void;
	colors?: never;
	/**
	 * Related gradient variations edited from the same palette controls.
	 */
	paletteVariations?: PaletteEditGradientVariation[];
};

export type PaletteEditProps = BasePaletteEdit &
	( PaletteEditColors | PaletteEditGradients );

type EditingElement = number | null;

export type ColorPickerPopoverProps< T extends Color | Gradient > = {
	element: T;
	onChange: ( newElement: T ) => void;
	isGradient?: T extends Gradient ? true : false;
	onClose?: () => void;
	popoverProps?: PaletteEditProps[ 'popoverProps' ];
};

export type NameInputProps = {
	label: string;
	onChange: ( nextName?: PaletteElement[ 'name' ] ) => void;
	value: PaletteElement[ 'name' ];
};

export type OptionProps< T extends Color | Gradient > = {
	element: T;
	onChange: ( newElement: T ) => void;
	isGradient: T extends Gradient ? true : false;
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	key: Key;
	onRemove: MouseEventHandler< HTMLButtonElement >;
	popoverProps?: PaletteEditProps[ 'popoverProps' ];
	slugPrefix: string;
};

export type PaletteEditListViewProps< T extends Color | Gradient > = {
	elements: T[];
	onChange: ( newElements?: T[] ) => void;
	isGradient: T extends Gradient ? true : false;
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	addColorRef: React.RefObject< HTMLButtonElement | null >;
	editingElement?: EditingElement;
	popoverProps?: PaletteEditProps[ 'popoverProps' ];
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: string;
};
