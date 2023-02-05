/**
 * External dependencies
 */
import type { ComponentProps } from 'react';

/**
 * Internal dependencies
 */
import type Button from '../button';

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
	colors: Color[];
	/**
	 * The gradients in the palette.
	 */
	gradients: Gradient[];
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
	canOnlyChangeValues?: boolean;
	canReset?: boolean;
	/**
	 *
	 * @default '''
	 */
	slugPrefix?: SlugPrefix;
};

type EditingElement = number | null;
export type SlugPrefix = string;

export type ColorPickerPopoverProps = {
	isGradient: boolean;
	element: PaletteElement;
	onChange: ( newElement: PaletteElement ) => void;
	onClose: () => void;
};

export type NameInputProps = {
	value: PaletteElement[ 'name' ];
	onChange: ( nextName?: PaletteElement[ 'name' ] ) => void;
	label: string;
};

export type OptionProps = {
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	element: PaletteElement;
	onChange: ( newElement: PaletteElement ) => void;
	isEditing: boolean;
	onStartEditing: () => void;
	onRemove: ComponentProps< typeof Button >[ 'onClick' ];
	onStopEditing: () => void;
	slugPrefix: SlugPrefix;
	isGradient: boolean;
};

export type PaletteEditListViewProps = {
	canOnlyChangeValues: boolean;
	editingElement: EditingElement;
	elements: PaletteElement[];
	isGradient: boolean;
	onChange: ( newElements?: PaletteElement[] ) => void;
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: SlugPrefix;
};
