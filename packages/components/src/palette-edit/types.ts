/**
 * External dependencies
 */
import type { Key, MouseEventHandler } from 'react';

/**
 * Internal dependencies
 */
import type { HeadingSize } from '../heading/types';

export type Color = {
	color: string;
	name: string;
	slug: string;
};

export type Gradient = {
	gradient: string;
	name: string;
	slug: string;
};

export type PaletteElement = Color | Gradient;

export type BasePaletteEdit = {
	/**
	 * A heading label for the palette.
	 */
	paletteLabel: string;
	/**
	 * A message to show if there's nothing to edit.
	 */
	emptyMessage?: string;
	/**
	 * Whether the user can only change the color or gradient values.
	 * If true, they cannot change names or delete values.
	 */
	canOnlyChangeValues?: boolean;
	/**
	 * Whether the user can reset the editor.
	 */
	canReset?: boolean;
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
	slugPrefix?: SlugPrefix;
};

type PaletteEditColors = {
	/**
	 * The colors in the palette.
	 *
	 * @default []
	 */
	colors: Color[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( newColors?: Color[] ) => void;
}

type PaletteEditGradients = {
	/**
	 * The gradients in the palette.
	 */
	gradients: Gradient[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( newGradients?: Gradient[] ) => void;
}

type PaletteEditColorsProps = BasePaletteEdit & PaletteEditColors;
export type PaletteEditGradientsProps = BasePaletteEdit & PaletteEditGradients;

export type PaletteEditProps =
	| PaletteEditColorsProps
	| PaletteEditGradientsProps;

type EditingElement = number | null;
export type SlugPrefix = string;

type BaseColorPickerPopover = {
	onClose?: () => void;
}

type ColorPickerPopoverColor = {
	element: Color;
	isGradient?: false;
	onChange: ( newElement: Color ) => void;
}

type ColorPickerPopoverGradient = {
	element: Gradient;
	isGradient: true;
	onChange: ( newElement: Gradient ) => void;
}

export type ColorPickerPopoverProps =
	| BaseColorPickerPopover & ColorPickerPopoverColor
	| BaseColorPickerPopover & ColorPickerPopoverGradient;

export type NameInputProps = {
	onChange: ( nextName?: PaletteElement[ 'name' ] ) => void;
	label: string;
	value: PaletteElement[ 'name' ];
};

type BaseOption = {
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	isEditing: boolean;
	key: Key;
	onRemove: MouseEventHandler< HTMLButtonElement >;
	onStartEditing: () => void;
	onStopEditing: () => void;
	slugPrefix: SlugPrefix;
}

type OptionColor = {
	element: Color;
	isGradient?: false;
	onChange: ( newColor: Color ) => void;
};

type OptionGradient = {
	element: Gradient;
	isGradient: true;
	onChange: ( newColor: Gradient ) => void;
};

export type OptionProps =
	| BaseOption & OptionColor
	| BaseOption & OptionGradient;

type BasePaletteEditListView = {
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	editingElement?: EditingElement;
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: SlugPrefix;
};

type PaletteEditListViewColors = {
	elements: Color[]
	onChange: ( newColors?: Color[] ) => void;
	isGradient?: false;
}

type PaletteEditListViewGradients = {
	elements: Gradient[]
	onChange: ( newGradients?: Gradient[] ) => void;
	isGradient: true;
}

export type PaletteEditListViewProps =
| BasePaletteEditListView & PaletteEditListViewColors
| BasePaletteEditListView & PaletteEditListViewGradients
