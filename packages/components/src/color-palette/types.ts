/**
 * External dependencies
 */
import type { CSSProperties, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { DropdownProps } from '../dropdown/types';
import type { HeadingSize } from '../heading/types';
import type { ColorEditingPropKey } from './private-keys';

export type ColorObject = {
	name: string;
	color: NonNullable< CSSProperties[ 'color' ] >;
	slug?: string;
};

export type PaletteObject = {
	name: string;
	colors: ColorObject[];
	slug?: string;
};

export type PaletteEditingCapability = 'value' | 'full';

export type PaletteColorPayload = {
	/** Slug of the palette (origin) the color belongs to: 'custom', 'theme', 'default'. */
	paletteSlug: string;
	/** Existing slug of the edited/removed color. Omitted on add. */
	slug?: string;
	/** Slug after the mutation completes; provided on add and rename. */
	nextSlug?: string;
	name: string;
	color: string;
};

export type ColorEditingProps = {
	/** Per-palette editing capability keyed by `slug`: `'full'` (add/rename/recolor/delete) or `'value'` (recolor only). */
	capabilities: Record< string, PaletteEditingCapability >;
	/** Called when the user submits the "add color" form (only 'full' palettes). */
	onAdd?: ( payload: PaletteColorPayload ) => void;
	/** Called when the user submits the edit form. */
	onUpdate?: ( payload: PaletteColorPayload ) => void;
	/** Called when the user confirms deletion (only 'full' palettes). */
	onDelete?: ( payload: { paletteSlug: string; slug: string } ) => void;
	/** Live preview while the edit form is open: candidate color on each change, `null` when preview ends. */
	onPreview?: (
		payload: { paletteSlug: string; slug: string; color: string } | null
	) => void;
};

type PaletteProps = {
	className?: string;
	clearColor: () => void;
	/**
	 * Callback called when a color is selected.
	 * The third argument is the slug of the selected palette entry, when available.
	 */
	onChange: ( newColor?: string, index?: number, slug?: string ) => void;
	value?: string;
	/**
	 * The slug of the currently selected palette entry.
	 *
	 * When set to a non-empty string, selection is determined by slug rather
	 * than by color value — this correctly handles palettes where two entries
	 * share the same color. Palette entries without a slug will not appear
	 * selected in this mode, even if their color value matches `value`.
	 *
	 * An empty string is treated the same as `undefined`: selection falls
	 * back to matching by color value.
	 */
	selectedSlug?: string;
	actions?: ReactNode;
	headingLevel?: HeadingSize;
};

export type SinglePaletteProps = PaletteProps & {
	colors: ColorObject[];
	/** Optional node appended after swatches (e.g. an add-custom-color control). */
	addAction?: ReactNode;
};

export type MultiplePalettesProps = PaletteProps & {
	colors: PaletteObject[];
	/** When true, renders an add-custom-color button in the custom palette row. */
	canAddCustomColor?: boolean;
	onAddCustom?: ( trigger: HTMLElement ) => void;
};

export type CustomColorPickerDropdownProps = DropdownProps & {
	isRenderedInSidebar: boolean;
};

export type ColorPaletteProps = Pick<
	PaletteProps,
	'onChange' | 'selectedSlug'
> & {
	/**
	 * Whether the palette should have a clearing button.
	 *
	 * @default true
	 */
	clearable?: boolean;
	/**
	 * Array with the colors to be shown. When displaying multiple color palettes
	 * to choose from, the format of the array changes from an array of colors
	 * objects, to an array of color palettes.
	 *
	 * @default []
	 */
	colors?: PaletteObject[] | ColorObject[];
	/**
	 * Whether to allow the user to pick a custom color on top of the predefined
	 * choices (defined via the `colors` prop).
	 *
	 * @default false
	 */
	disableCustomColors?: boolean;
	/**
	 * This controls whether the alpha channel will be offered when selecting
	 * custom colors.
	 *
	 * @default false
	 */
	enableAlpha?: boolean;
	/**
	 * The heading level.
	 *
	 * @default 2
	 */
	headingLevel?: HeadingSize;
	/**
	 * Currently active value.
	 */
	value?: string;
	/**
	 * Whether the control should present as a set of buttons,
	 * each with its own tab stop.
	 *
	 * @default false
	 */
	asButtons?: boolean;
	/**
	 * Prevents keyboard interaction from wrapping around.
	 * Only used when `asButtons` is not true.
	 *
	 * @default true
	 */
	loop?: boolean;
	/**
	 * Whether this is rendered in the sidebar.
	 *
	 * @default false
	 */
	__experimentalIsRenderedInSidebar?: boolean;
} & (
		| {
				/**
				 * A label to identify the purpose of the control.
				 *
				 * @todo [#54055] Either this or `aria-labelledby` should be required
				 */
				'aria-label'?: string;
				'aria-labelledby'?: never;
		  }
		| {
				/**
				 * An ID of an element to provide a label for the control.
				 *
				 * @todo [#54055] Either this or `aria-label` should be required
				 */
				'aria-labelledby'?: string;
				'aria-label'?: never;
		  }
	);

export type ColorPaletteInternalProps = ColorPaletteProps & {
	[ K in ColorEditingPropKey ]?: ColorEditingProps;
} & {
	/**
	 * Legacy prop forwarded by some consumers.
	 * It is destructured only so it isn't spread onto the root element.
	 */
	hasColorsToChoose?: boolean;
};
