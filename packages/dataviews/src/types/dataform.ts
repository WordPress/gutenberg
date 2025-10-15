/**
 * Internal dependencies
 */
import type { Field, FieldValidity } from './field-api';

/**
 * DataForm layouts.
 */
export type LayoutType = 'regular' | 'panel' | 'card' | 'row';
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
	  }
	| {
			type: 'card';
			withHeader?: true | undefined;
			isOpened?: boolean;
			summary?: CardSummaryField;
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
	  }
	| {
			type: 'card';
			withHeader: true;
			isOpened: boolean;
			summary: NormalizedCardSummaryField;
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

export type Layout = RegularLayout | PanelLayout | CardLayout | RowLayout;
export type NormalizedLayout =
	| NormalizedRegularLayout
	| NormalizedPanelLayout
	| NormalizedCardLayout
	| NormalizedRowLayout;

export type NormalizedSummaryField =
	| NormalizedPanelSummaryField
	| NormalizedCardSummaryField;

export type SimpleFormField = {
	id: string;
	layout?: Layout;
};

export type CombinedFormField = {
	id: string;
	label?: string;
	description?: string;
	layout?: Layout;
	children: Array< FormField | string >;
};

export type FormField = SimpleFormField | CombinedFormField;

/**
 * The form configuration.
 */
export type Form = {
	layout?: Layout;
	fields?: Array< FormField | string >;
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
	field: FormField;
	onChange: ( value: any ) => void;
	hideLabelFromVision?: boolean;
	validity?: FieldValidity;
}
