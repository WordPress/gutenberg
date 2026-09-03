import type { Field, FieldValidity } from './field-api';

/**
 * The layouts available for rendering a form or a form field:
 *
 * - `regular`: renders the field's edit control directly.
 * - `panel`: renders a button showing the field's value that opens
 *   the edit control in a dropdown or modal.
 * - `card`: renders the fields grouped within a card container.
 * - `row`: renders the fields horizontally in a single row.
 * - `details`: renders the fields within a collapsible details element.
 */
export type LayoutType = 'regular' | 'panel' | 'card' | 'row' | 'details';

/**
 * Where the field's label is placed relative to its edit control:
 * above it (`top`), next to it (`side`), or visually hidden (`none`).
 */
export type LabelPosition = 'top' | 'side' | 'none';

/**
 * The field (or fields) whose value is displayed as the summary
 * of a panel: a single field id or a list of field ids.
 */
export type PanelSummaryField = string | string[];

/**
 * The normalized version of {@link PanelSummaryField}: always a list of field ids.
 */
export type NormalizedPanelSummaryField = string[];

/**
 * The regular layout: renders the field's edit control directly.
 */
export type RegularLayout = {
	/**
	 * The layout type.
	 */
	type: 'regular';

	/**
	 * The position of the field's label. Defaults to `top`.
	 */
	labelPosition?: LabelPosition;
};

/**
 * The normalized version of {@link RegularLayout}, with defaults applied.
 */
export type NormalizedRegularLayout = {
	/**
	 * The layout type.
	 */
	type: 'regular';

	/**
	 * The position of the field's label.
	 */
	labelPosition: LabelPosition;
};

/**
 * When the edit trigger of a panel field is visible:
 * always, or only when the field is hovered or focused.
 */
export type EditVisibility = 'always' | 'on-hover';

/**
 * Configuration to open a panel's edit control in a dropdown.
 */
type PanelOpenAsDropdown = {
	/**
	 * The kind of overlay used to edit the field.
	 */
	type: 'dropdown';
};

/**
 * Configuration to open a panel's edit control in a modal.
 */
export type PanelOpenAsModal = {
	/**
	 * The kind of overlay used to edit the field.
	 */
	type: 'modal';

	/**
	 * The label of the modal's button that applies the changes.
	 */
	applyLabel: string;

	/**
	 * The label of the modal's button that discards the changes.
	 */
	cancelLabel: string;
};

/**
 * The panel layout: renders a button showing the field's value
 * that opens the edit control in a dropdown or modal.
 */
export type PanelLayout = {
	/**
	 * The layout type.
	 */
	type: 'panel';

	/**
	 * The position of the field's label. Defaults to `side`.
	 */
	labelPosition?: LabelPosition;

	/**
	 * The kind of overlay used to edit the field: a dropdown (default) or a modal.
	 * The modal's apply/cancel button labels can be customized via the object form.
	 */
	openAs?:
		| 'dropdown'
		| 'modal'
		| { type: 'dropdown' }
		| { type: 'modal'; applyLabel?: string; cancelLabel?: string };

	/**
	 * The field (or fields) whose value is displayed as the panel's summary.
	 */
	summary?: PanelSummaryField;

	/**
	 * When the edit trigger is visible: always, or only on hover/focus (default).
	 */
	editVisibility?: EditVisibility;
};

/**
 * The normalized version of {@link PanelLayout}, with defaults applied.
 */
export type NormalizedPanelLayout = {
	/**
	 * The layout type.
	 */
	type: 'panel';

	/**
	 * The position of the field's label.
	 */
	labelPosition: LabelPosition;

	/**
	 * The kind of overlay used to edit the field.
	 */
	openAs: PanelOpenAsDropdown | PanelOpenAsModal;

	/**
	 * The list of field ids displayed as the panel's summary.
	 */
	summary: NormalizedPanelSummaryField;

	/**
	 * When the edit trigger is visible.
	 */
	editVisibility: EditVisibility;
};

/**
 * The field (or fields) displayed as the summary in a card's header.
 * Each entry is a field id, or an object also declaring when the field
 * is visible: always, or only when the card is collapsed (the default).
 */
export type CardSummaryField =
	| PanelSummaryField
	| Array<
			| string
			| {
					id: string;
					visibility: 'always' | 'when-collapsed';
			  }
	  >;

/**
 * The normalized version of {@link CardSummaryField}: always a list
 * of objects with the field id and its visibility.
 */
export type NormalizedCardSummaryField = Array< {
	/**
	 * The id of the field displayed as summary.
	 */
	id: string;

	/**
	 * When the summary field is visible: always,
	 * or only when the card is collapsed.
	 */
	visibility: 'always' | 'when-collapsed';
} >;

/**
 * The card layout: renders the fields grouped within a card container,
 * optionally with a header that can collapse/expand the card's content.
 */
export type CardLayout =
	| {
			/**
			 * The layout type.
			 */
			type: 'card';

			/**
			 * Whether the card displays a header. Without a header,
			 * the card is always open and not collapsible.
			 */
			withHeader: false;

			/**
			 * Whether the card's content is displayed.
			 *
			 * isOpened cannot be false if withHeader is false as well;
			 * otherwise, the card would not be visible.
			 */
			isOpened?: true;

			/**
			 * Whether the card's content can be collapsed.
			 *
			 * isCollapsible cannot be true if withHeader is false as well.
			 */
			isCollapsible?: false;
	  }
	| {
			/**
			 * The layout type.
			 */
			type: 'card';

			/**
			 * Whether the card displays a header. Defaults to `true`.
			 */
			withHeader?: true | undefined;

			/**
			 * Whether the card's content is displayed. Defaults to `true`.
			 */
			isOpened?: boolean;

			/**
			 * The field (or fields) displayed as summary in the card's header.
			 */
			summary?: CardSummaryField;

			/**
			 * Whether the card's content can be collapsed. Defaults to `true`.
			 */
			isCollapsible?: boolean | undefined;
	  };

/**
 * The normalized version of {@link CardLayout}, with defaults applied.
 */
export type NormalizedCardLayout =
	| {
			/**
			 * The layout type.
			 */
			type: 'card';

			/**
			 * Whether the card displays a header.
			 */
			withHeader: false;

			/**
			 * Whether the card's content is displayed.
			 *
			 * isOpened cannot be false if withHeader is false as well;
			 * otherwise, the card would not be visible.
			 */
			isOpened: true;

			/**
			 * The fields displayed as summary in the card's header.
			 */
			summary: [];

			/**
			 * Whether the card's content can be collapsed.
			 *
			 * If no header, the card should not be collapsible.
			 */
			isCollapsible: false;
	  }
	| {
			/**
			 * The layout type.
			 */
			type: 'card';

			/**
			 * Whether the card displays a header.
			 */
			withHeader: true;

			/**
			 * Whether the card's content is displayed.
			 */
			isOpened: boolean;

			/**
			 * The fields displayed as summary in the card's header.
			 */
			summary: NormalizedCardSummaryField;

			/**
			 * Whether the card's content can be collapsed.
			 */
			isCollapsible: boolean;
	  };

/**
 * The row layout: renders the fields horizontally in a single row.
 */
export type RowLayout = {
	/**
	 * The layout type.
	 */
	type: 'row';

	/**
	 * The vertical alignment of the fields within the row. Defaults to `center`.
	 */
	alignment?: 'start' | 'center' | 'end';

	/**
	 * Per-field styles, keyed by field id. Currently supports the
	 * `flex` CSS property to control how each field grows or shrinks.
	 */
	styles?: Record< string, { flex?: React.CSSProperties[ 'flex' ] } >;
};

/**
 * The normalized version of {@link RowLayout}, with defaults applied.
 */
export type NormalizedRowLayout = {
	/**
	 * The layout type.
	 */
	type: 'row';

	/**
	 * The vertical alignment of the fields within the row.
	 */
	alignment: 'start' | 'center' | 'end';

	/**
	 * Per-field styles, keyed by field id.
	 */
	styles: Record< string, { flex?: React.CSSProperties[ 'flex' ] } >;
};

/**
 * The details layout: renders the fields within a collapsible details element.
 */
export type DetailsLayout = {
	/**
	 * The layout type.
	 */
	type: 'details';

	/**
	 * The id of the field whose rendered value is displayed as the clickable
	 * summary of the details element. When omitted, the summary falls back
	 * to the form field's label or to "More details".
	 */
	summary?: string;
};

/**
 * The normalized version of {@link DetailsLayout}, with defaults applied.
 */
export type NormalizedDetailsLayout = {
	/**
	 * The layout type.
	 */
	type: 'details';

	/**
	 * The id of the field whose rendered value is displayed as the clickable
	 * summary of the details element. An empty string when no summary field
	 * is configured, in which case the form field's label or "More details"
	 * is displayed instead.
	 */
	summary: string;
};

/**
 * The layout configuration for a form or a form field.
 */
export type Layout =
	| RegularLayout
	| PanelLayout
	| CardLayout
	| RowLayout
	| DetailsLayout;

/**
 * The normalized version of {@link Layout}, with defaults applied.
 */
export type NormalizedLayout =
	| NormalizedRegularLayout
	| NormalizedPanelLayout
	| NormalizedCardLayout
	| NormalizedRowLayout
	| NormalizedDetailsLayout;

/**
 * A normalized summary field, for panel or card layouts.
 */
export type NormalizedSummaryField =
	| NormalizedPanelSummaryField
	| NormalizedCardSummaryField;

/**
 * A field within a form. Can also be expressed as a plain string (the field id).
 */
export type FormField = {
	/**
	 * The id of the field to render.
	 */
	id: string;

	/**
	 * A label overriding the field's own label.
	 */
	label?: string;

	/**
	 * A description overriding the field's own description.
	 */
	description?: string;

	/**
	 * The layout used to render this field,
	 * overriding the form's layout.
	 */
	layout?: Layout;

	/**
	 * Child fields, for layouts that group fields together
	 * (panel, card, row, details). Each child is a form field
	 * or a plain field id.
	 */
	children?: Array< FormField | string >;
};

/**
 * The normalized version of {@link FormField}, with the layout resolved
 * and children expanded into normalized form fields.
 */
export type NormalizedFormField = {
	/**
	 * The id of the field to render.
	 */
	id: string;

	/**
	 * The layout used to render this field.
	 */
	layout: NormalizedLayout;

	/**
	 * A label overriding the field's own label.
	 */
	label?: string;

	/**
	 * A description overriding the field's own description.
	 */
	description?: string;

	/**
	 * Child fields, for layouts that group fields together.
	 */
	children?: NormalizedFormField[];
};

/**
 * The form configuration.
 */
export type Form = {
	/**
	 * The layout used to render the form's fields,
	 * unless a field overrides it. Defaults to the
	 * regular layout.
	 */
	layout?: Layout;

	/**
	 * The fields to render, in order. Each entry is a form field
	 * or a plain field id.
	 */
	fields?: Array< FormField | string >;
};

/**
 * The normalized version of {@link Form}, with defaults applied.
 */
export type NormalizedForm = {
	/**
	 * The layout used to render the form's fields,
	 * unless a field overrides it.
	 */
	layout: NormalizedLayout;

	/**
	 * The fields to render, in order.
	 */
	fields: NormalizedFormField[];
};

/**
 * The props of the DataForm component.
 */
export interface DataFormProps< Item > {
	/**
	 * The item being edited.
	 */
	data: Item;

	/**
	 * The field definitions for the item.
	 */
	fields: Field< Item >[];

	/**
	 * The form configuration: which fields to render and with which layout.
	 */
	form: Form;

	/**
	 * Callback invoked when the user edits a field, receiving the partial
	 * item returned by the field's `setValue`. By default that is an object
	 * keyed by field id, nested for dotted ids (e.g. `{ a: { b: value } }`
	 * for the field `a.b`); a custom `setValue` may return any other partial
	 * shape of the item.
	 */
	onChange: ( value: Record< string, any > ) => void;

	/**
	 * The validity state of the form's fields, keyed by field id.
	 */
	validity?: FormValidity;
}

/**
 * The validity state of a form: a map from field id
 * to that field's validity.
 */
export type FormValidity = Record< string, FieldValidity > | undefined;

/**
 * The props received by every DataForm field layout component.
 */
export interface FieldLayoutProps< Item > {
	/**
	 * The item being edited.
	 */
	data: Item;

	/**
	 * The normalized form field to render.
	 */
	field: NormalizedFormField;

	/**
	 * Callback invoked when the user edits the field, receiving the partial
	 * item returned by the field's `setValue`. By default that is an object
	 * keyed by field id, nested for dotted ids; a custom `setValue` may
	 * return any other partial shape of the item.
	 */
	onChange: ( value: any ) => void;

	/**
	 * Whether the field's label is visually hidden
	 * (but still available to assistive technology).
	 */
	hideLabelFromVision?: boolean;

	/**
	 * Whether to append "(optional)" to the label of optional fields,
	 * instead of marking required fields.
	 */
	markWhenOptional?: boolean;

	/**
	 * The validity state of the field.
	 */
	validity?: FieldValidity;
}
