/**
 * Internal dependencies
 */
import type { Field, FieldValidity } from './field-api';

/**
 * DataForm layouts.
 */
export type LayoutType = 'regular' | 'panel' | 'card' | 'row' | 'details';
export type LabelPosition = 'top' | 'side' | 'none';

export type PanelSummaryField = string | string[];
export type NormalizedPanelSummaryField = string[];

export type RegularLayout = {
	type: 'regular';
	labelPosition?: LabelPosition;
};
export type NormalizedRegularLayout = {
	type: 'regular';
	labelPosition: LabelPosition;
};

export type PanelLayout = {
	type: 'panel';
	labelPosition?: LabelPosition;
	openAs?: 'dropdown' | 'modal';
	summary?: PanelSummaryField;
};
export type NormalizedPanelLayout = {
	type: 'panel';
	labelPosition: LabelPosition;
	openAs: 'dropdown' | 'modal';
	summary: NormalizedPanelSummaryField;
};

export type CardSummaryField =
	| PanelSummaryField // Basic usage: string or string[]
	| Array<
			| string
			| {
					id: string;
					visibility: 'always' | 'when-collapsed';
			  }
	  >;

export type NormalizedCardSummaryField = Array< {
	id: string;
	visibility: 'always' | 'when-collapsed';
} >;

export type CardLayout =
	| {
			type: 'card';
			withHeader: false;
			// isOpened cannot be false if withHeader is false as well.
			// Otherwise, the card would not be visible.
			isOpened?: true;
			// isCollapsible cannot be true if withHeader is false as well.
			isCollapsible?: false;
	  }
	| {
			type: 'card';
			withHeader?: true | undefined;
			isOpened?: boolean;
			summary?: CardSummaryField;
			isCollapsible?: boolean | undefined;
	  };
export type NormalizedCardLayout =
	| {
			type: 'card';
			withHeader: false;
			// isOpened cannot be false if withHeader is false as well.
			// Otherwise, the card would not be visible.
			isOpened: true;
			// Summary is an empty array
			summary: [];
			// If no header, the card should not be collapsible.
			isCollapsible: false;
	  }
	| {
			type: 'card';
			withHeader: true;
			isOpened: boolean;
			summary: NormalizedCardSummaryField;
			isCollapsible: boolean;
	  };

export type RowLayout = {
	type: 'row';
	alignment?: 'start' | 'center' | 'end';
	styles?: Record< string, { flex?: React.CSSProperties[ 'flex' ] } >;
};
export type NormalizedRowLayout = {
	type: 'row';
	alignment: 'start' | 'center' | 'end';
	styles: Record< string, { flex?: React.CSSProperties[ 'flex' ] } >;
};

export type DetailsLayout = {
	type: 'details';
	summary?: string;
};
export type NormalizedDetailsLayout = {
	type: 'details';
	summary: string;
};

export type Layout =
	| RegularLayout
	| PanelLayout
	| CardLayout
	| RowLayout
	| DetailsLayout;
export type NormalizedLayout =
	| NormalizedRegularLayout
	| NormalizedPanelLayout
	| NormalizedCardLayout
	| NormalizedRowLayout
	| NormalizedDetailsLayout;

export type NormalizedSummaryField =
	| NormalizedPanelSummaryField
	| NormalizedCardSummaryField;

export type FormField = {
	id: string;
	label?: string;
	description?: string;
	layout?: Layout;
	children?: Array< FormField | string >;
};
export type NormalizedFormField = {
	id: string;
	layout: NormalizedLayout;
	label?: string;
	description?: string;
	children?: NormalizedFormField[];
};

/**
 * The form configuration.
 */
export type Form = {
	layout?: Layout;
	fields?: Array< FormField | string >;
};
export type NormalizedForm = {
	layout: NormalizedLayout;
	fields: NormalizedFormField[];
};

export interface DataFormProps< Item > {
	data: Item;
	fields: Field< Item >[];
	form: Form;
	onChange: ( value: Record< string, any > ) => void;
	validity?: FormValidity;
}

export type FormValidity = Record< string, FieldValidity > | undefined;

export interface FieldLayoutProps< Item > {
	data: Item;
	field: NormalizedFormField;
	onChange: ( value: any ) => void;
	hideLabelFromVision?: boolean;
	markWhenOptional?: boolean;
	validity?: FieldValidity;
}
