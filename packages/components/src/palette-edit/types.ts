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

export type PaletteEditProps = {
	gradients: Gradient[];
	/**
	 * The colors in the palette.
	 *
	 * @default []
	 */
	colors: Color[];
	/**
	 * Runs on changing the value.
	 */
	onChange: ( newColors?: Array< Color | Gradient > ) => void;
	paletteLabel: string;
	emptyMessage: string;
	canOnlyChangeValues: boolean;
	canReset: boolean;
	/**
	 *
	 * @default '''
	 */
	slugPrefix?: string;
};
