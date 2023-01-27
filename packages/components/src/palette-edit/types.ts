export type NameInputProps = {
	value: string;
	onChange: ( value?: string ) => void;
	label: string;
};

type Element = {
	name: string;
	slug: string;
};

export type Color = {
	color: string;
	gradient?: never;
} & Element;

export type Gradient = {
	gradient: string;
	color?: never;
} & Element;

export type ColorOrGradient = Color | Gradient;
export type Gradients = Gradient[];
export type Colors = Color[];

export type SlugPrefix = string;

export type OptionProps = {
	canOnlyChangeValues: boolean;
	element: Gradient | Color;
	onChange: ( element?: Gradient | Color ) => void;
	isEditing: boolean;
	onStartEditing: () => void;
	onRemove: () => void;
	onStopEditing: () => void;
	slugPrefix: SlugPrefix;
	isGradient: boolean;
};

export type PaletteEditProps = {
	gradients: Gradients;
	colors: Colors;
	onChange: ( elements?: ColorOrGradient[] ) => void;
	paletteLabel: string;
	emptyMessage: string;
	canOnlyChangeValues: boolean;
	canReset: boolean;
	slugPrefix?: SlugPrefix;
};

export type PaletteEditListViewProps = {
	elements: Gradients | Colors;
	onChange: ( elements?: ColorOrGradient[] ) => void;
	editingElement: number | null;
	setEditingElement: ( index: number | null ) => void;
	canOnlyChangeValues: boolean;
	slugPrefix: SlugPrefix;
	isGradient: boolean;
};
