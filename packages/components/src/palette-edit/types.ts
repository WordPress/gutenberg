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
	gradients: never;
	/**
	 * The colors in the palette.
	 *
	 * @default []
	 */
	colors: Color[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( newColors: Color[] ) => void;
}

type PaletteEditGradients = {
	colors: never;
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

export type ColorPickerPopoverProps< T extends Color | Gradient > = {
	element: T;
	isGradient?: boolean;
	onChange: ( newElement: T ) => void;
	onClose?: () => void;
};

export type NameInputProps = {
	onChange: ( nextName?: PaletteElement[ 'name' ] ) => void;
	label: string;
	value: PaletteElement[ 'name' ];
};

export type OptionProps< T extends Color | Gradient > = {
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	element: T;
	isEditing: boolean;
	isGradient?: boolean;
	key: Key;
	onChange: ( newElement: T ) => void;
	onRemove: MouseEventHandler< HTMLButtonElement >;
	onStartEditing: () => void;
	onStopEditing: () => void;
	slugPrefix: SlugPrefix;
};

export type PaletteEditListViewProps< T extends Color | Gradient > = {
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	editingElement?: EditingElement;
	elements: T[];
	isGradient?: boolean;
	onChange: ( newElements?: T[] ) => void;
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: SlugPrefix;
};
