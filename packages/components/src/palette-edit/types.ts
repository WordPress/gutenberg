/**
 * External dependencies
 */
import type { MouseEventHandler } from 'react';

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

export type PaletteEditProps = {
	/**
	 * The colors in the palette.
	 *
	 * @default []
	 */
	colors?: Color[];
	/**
	 * The gradients in the palette.
	 */
	gradients?: Gradient[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( newColors?: Array< PaletteElement > ) => void;
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
	 * If false, they can change the names and delete values.
	 */
	canOnlyChangeValues?: boolean;
	/**
	 * Whether you can reset the editor.
	 */
	canReset?: boolean;
	/**
	 * The prefix for the element slug.
	 *
	 * @default ''
	 */
	slugPrefix?: SlugPrefix;
};

type EditingElement = number | null;
export type SlugPrefix = string;

export type ColorPickerPopoverProps = {
	element: PaletteElement;
	isGradient?: boolean;
	onChange: ( newElement: PaletteElement ) => void;
	onClose?: () => void;
};

export type NameInputProps = {
	onChange: ( nextName?: PaletteElement[ 'name' ] ) => void;
	label: string;
	value: PaletteElement[ 'name' ];
};

export type OptionProps = {
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	element: PaletteElement;
	isEditing: boolean;
	isGradient?: boolean;
	onChange: ( newElement: PaletteElement ) => void;
	onRemove: MouseEventHandler< HTMLButtonElement >;
	onStartEditing: () => void;
	onStopEditing: () => void;
	slugPrefix: SlugPrefix;
};

export type PaletteEditListViewProps = {
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	editingElement?: EditingElement;
	elements: PaletteElement[];
	isGradient?: boolean;
	onChange: ( newElements?: PaletteElement[] ) => void;
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: SlugPrefix;
};
