import type { Key, MouseEventHandler } from 'react';
import type Popover from '../popover';
import type { HeadingSize } from '../heading/types';

export type Color = {
	color: string;
	name: string;
	slug: string;
	gradient?: never;
	colors?: never;
};

export type Gradient = {
	gradient: string;
	name: string;
	slug: string;
	color?: never;
	colors?: never;
};

export type Duotone = {
	colors: string[];
	name: string;
	slug: string;
	color?: never;
	gradient?: never;
};

export type PaletteElement = Color | Gradient | Duotone;

/**
 * The kind of preset a `PaletteEdit` instance is editing.
 */
export type PaletteVariant = 'color' | 'gradient' | 'duotone';

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
	duotones?: never;
	colorPalette?: never;
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
	duotones?: never;
	colorPalette?: never;
};

type PaletteEditDuotones = {
	/**
	 * The duotones in the palette.
	 */
	duotones: Duotone[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( values?: Duotone[] ) => void;
	/**
	 * The colors offered when picking the shadows and highlights of a duotone,
	 * and from which the value of a newly added duotone is derived.
	 *
	 * @default []
	 */
	colorPalette?: Color[];
	colors?: never;
	gradients?: never;
};

export type PaletteEditProps = BasePaletteEdit &
	( PaletteEditColors | PaletteEditGradients | PaletteEditDuotones );

type EditingElement = number | null;

export type ColorPickerPopoverProps< T extends PaletteElement > = {
	element: T;
	onChange: ( newElement: T ) => void;
	variant: PaletteVariant;
	colorPalette?: Color[];
	onClose?: () => void;
	popoverProps?: PaletteEditProps[ 'popoverProps' ];
};

export type NameInputProps = {
	label: string;
	onChange: ( nextName?: PaletteElement[ 'name' ] ) => void;
	value: PaletteElement[ 'name' ];
};

export type OptionProps< T extends PaletteElement > = {
	element: T;
	onChange: ( newElement: T ) => void;
	variant: PaletteVariant;
	colorPalette?: Color[];
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	key: Key;
	onRemove: MouseEventHandler< HTMLButtonElement >;
	popoverProps?: PaletteEditProps[ 'popoverProps' ];
	slugPrefix: string;
};

export type PaletteEditListViewProps< T extends PaletteElement > = {
	elements: T[];
	onChange: ( newElements?: T[] ) => void;
	variant: PaletteVariant;
	colorPalette?: Color[];
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	addColorRef: React.RefObject< HTMLButtonElement | null >;
	editingElement?: EditingElement;
	popoverProps?: PaletteEditProps[ 'popoverProps' ];
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: string;
};
