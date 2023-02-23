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

export type PaletteEditProps< T extends Color | Gradient > = {
	/**
	 * The colors in the palette.
	 *
	 * @default []
	 */
	colors: T[] | never;
	/**
	 * Runs on changing the value.
	 */
	onChange: ( newElements?: T[] ) => void;
	/**
	 * The gradients in the palette.
	 */
	gradients: T[] | never;
	/**
	 * Runs on changing the value.
	 */
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

type EditingElement = number | null;
export type SlugPrefix = string;

export type ColorPickerPopoverProps< T extends Color | Gradient > = {
	onClose?: () => void;
	element: T;
	isGradient?: boolean;
	onChange: ( newElement: T ) => void;
}

export type NameInputProps = {
	onChange: ( nextName?: PaletteElement[ 'name' ] ) => void;
	label: string;
	value: PaletteElement[ 'name' ];
};

export type OptionProps< T extends Color | Gradient > = {
	element: T;
	onChange: ( newElement: T ) => void;
	isGradient?: boolean;
	canOnlyChangeValues: PaletteEditProps< T >[ 'canOnlyChangeValues' ];
	isEditing: boolean;
	key: Key;
	onRemove: MouseEventHandler< HTMLButtonElement >;
	onStartEditing: () => void;
	onStopEditing: () => void;
	slugPrefix: SlugPrefix;
}

export type PaletteEditListViewProps< T extends ( Gradient | Color ) > = {
	elements: T[]
	onChange: ( newGradients?: T[] ) => void;
	isGradient?: boolean;
	canOnlyChangeValues: PaletteEditProps< T >[ 'canOnlyChangeValues' ];
	editingElement?: EditingElement;
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: SlugPrefix;
}
