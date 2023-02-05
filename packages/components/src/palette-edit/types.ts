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
	canOnlyChangeValues: boolean;
	canReset: boolean;
	/**
	 *
	 * @default '''
	 */
	slugPrefix?: string;
};

type EditingElement = number | null;

export type PaletteEditListViewProps = {
	canOnlyChangeValues: boolean;
	editingElement: EditingElement;
	elements: PaletteElement[];
	isGradient: boolean;
	onChange: ( newElements?: PaletteElement[] ) => void;
	setEditingElement: ( newEditingElement?: EditingElement ) => void;
	slugPrefix: string;
};
