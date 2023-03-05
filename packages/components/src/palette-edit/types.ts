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
	 * Whether the user can only change the color or gradient values.
	 * If true, they cannot change names or delete values.
	 */
	canOnlyChangeValues?: boolean;
	/**
	 * Whether the user can reset the editor.
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
	slugPrefix?: SlugPrefix;
};

type PaletteEditColors = {
	/**
	 * The colors in the palette.
	 */
	colors?: Color[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( newColors?: Color[] ) => void;
};

type PaletteEditGradients = {
	/**
	 * The gradients in the palette.
	 */
	gradients?: Gradient[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( newGradients?: Gradient[] ) => void;
};

export type PaletteEditColorsProps = BasePaletteEdit & PaletteEditColors;
export type PaletteEditGradientsProps = BasePaletteEdit & PaletteEditGradients;

export type PaletteEditProps =
	| PaletteEditColorsProps
	| PaletteEditGradientsProps;

type EditingElement = number | null;
export type SlugPrefix = string;

export type ColorPickerPopoverProps< T extends Color | Gradient > = {
	element: T;
	onChange: ( newElement: T ) => void;
	isGradient?: T extends Gradient ? true : false;
	onClose?: () => void;
};

export type NameInputProps = {
	label: string;
	onChange: ( nextName?: PaletteElement[ 'name' ] ) => void;
	value: PaletteElement[ 'name' ];
};

export type OptionProps< T extends Color | Gradient > = {
	element: T;
	onChange: ( newElement: T ) => void;
	isGradient?: T extends Gradient ? true : false;
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	isEditing: boolean;
	key: Key;
	onRemove: MouseEventHandler< HTMLButtonElement >;
	onStartEditing: () => void;
	onStopEditing: () => void;
	slugPrefix: SlugPrefix;
};

export type PaletteEditListViewProps< T extends Color | Gradient > = {
	elements: T[];
	onChange: ( newElements?: T[] ) => void;
	isGradient?: T extends Gradient ? true : false;
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	editingElement?: EditingElement;
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: SlugPrefix;
};
