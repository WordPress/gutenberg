/**
 * External dependencies
 */
import type { Key, MouseEventHandler } from 'react';

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
	isEditing: boolean;
	key: Key;
	onRemove: MouseEventHandler< HTMLButtonElement >;
	onStartEditing: () => void;
	onStopEditing: () => void;
	popoverProps?: PaletteEditProps[ 'popoverProps' ];
	slugPrefix: string;
};

export type PaletteEditListViewProps< T extends Color | Gradient > = {
	elements: T[];
	onChange: ( newElements?: T[] ) => void;
	isGradient: T extends Gradient ? true : false;
	canOnlyChangeValues: PaletteEditProps[ 'canOnlyChangeValues' ];
	editingElement?: EditingElement;
	popoverProps?: PaletteEditProps[ 'popoverProps' ];
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: string;
};
