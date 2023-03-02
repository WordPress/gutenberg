/**
 * Internal dependencies
 */
import type { BlockType } from './block-type';

/**
 * Control type used to indicate axial (column/row) block spacing controls.
 *
 * @see {@link BlockSupports.spacing}
 * @public
 */
export type AxialDirection = 'horizontal' | 'vertical';

/**
 * Control type used to indicate CSS spacing for arbitrary sides.
 *
 * @see {@link BlockSupports.spacing}
 * @public
 */
export type CSSDirection = 'top' | 'right' | 'bottom' | 'left';

/**
 * Control type used to indicate block’s alignment.
 *
 * @see {@link BlockSupports.align}
 * @public
 */
export type BlockAlignment = 'left' | 'center' | 'right' | 'wide' | 'full';

/**
 * CSS style properties related to dimensions of {@link BlockSupports}.
 *
 * When it does, the block editor will show UI controls for the user to set their values if
 * {@link https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/#opt-in-into-ui-controls the theme declares support}.
 *
 * @see {@link BlockSupports.dimensions}
 * @public
 */
export type BlockDimensions = {
	/**
	 * Enable min height control.
	 */
	minHeight: boolean;
};

/**
 * {@link BlockSupports} interface to enable CSS style properties related to position.
 *
 * When it does, the block editor will show UI controls for the user to set their values if
 * {@link https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/#opt-in-into-ui-controls the theme declares support}.
 *
 * @see {@link BlockSupports.position}
 * @public
 */
export type BlockPosition = {
	/**
	 * Enable selecting sticky position.
	 */
	sticky: boolean;
};

/**
 * {@link BlockSupports} interface to enable some of the properties related to color.
 *
 * Enables UI color controls in the block editor.
 *
 * @see {@link BlockSupports.color}
 * @public
 */
export interface ColorProps {
	/**
	 * This property adds UI controls which allow the user to apply
	 * a solid background color to a block.
	 *
	 * When the block declares support for `color.background`,
	 * the attributes of a block will include two new entries:
	 * `backgroundColor` and `style`.
	 *
	 * (default) true
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-background https://developer.wordpress.org}
	 */
	background: boolean;

	/**
	 * This property adds UI controls which allow the user to apply
	 * a gradient background to a block.
	 *
	 * When the block declares support for `color.background`,
	 * the attributes of a block will include two new entries:
	 * `gradient` and `style`.
	 *
	 * (default) false
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-gradients color.gradients} on developer.wordpress.org
	 */
	gradients: boolean;

	/**
	 * This property adds block controls which allow the user
	 * to set link color in a block, link color is disabled by default.
	 *
	 * (default) false
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-link color.link} on developer.wordpress.org
	 */
	link: boolean;

	/**
	 * This property adds block controls which allow the user
	 * to set text color in a block.
	 *
	 * (default) true
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-text color.text} on developer.wordpress.org
	 */
	text: boolean;

	/**
	 * This property adds UI controls which allow to apply a duotone filter
	 * to a block or part of a block.
	 *
	 * (default) undefined
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color-__experimentalduotone __experimentalDuotone} on developer.wordpress.org
	 * @internal
	 */
	__experimentalDuotone?: string;
}

/**
 * {@link BlockSupports} interface to enable some typography related properties.
 *
 * When it does, the block editor will show a typography UI allowing the user to control their values.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#typography typography} on developer.wordpress.org
 * @public
 */

export interface TypographyProps {
	/**
	 * This value signals that a block supports the font-size
	 * CSS style property. When it does, the block editor will
	 * show an UI control for the user to set its value.
	 *
	 * The values shown in this control are the ones declared
	 * by the theme via the editor-font-sizes theme support,
	 * or the default ones if none are provided.
	 *
	 * (default) false
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#typography-fontsize fontSize} on developer.wordpress.org
	 * @see {@link https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-support/#block-font-sizes Font Size} on developer.wordpress.org
	 */
	fontSize: boolean;

	/**
	 * This value signals that a block supports the line-height
	 * CSS style property. When it does, the block editor will
	 * show an UI control for the user to set its value if the
	 * theme declares support.
	 *
	 * (default) false
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#typography-lineheight lineHeight} on developer.wordpress.org
	 * @see {@link https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-support/#supporting-custom-line-heights Line Heights} on developer.wordpress.org
	 */
	lineHeight: boolean;
}

/**
 * {@link BlockSupports} interface to enable some of the CSS style properties related to spacing.
 *
 * When it does, the block editor will show UI controls for the user to set their values if
 * {@link https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/#opt-in-into-ui-controls the theme declares support}.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#spacing spacing} on developer.wordpress.org
 * @public
 */
export interface SpacingProps {
	blockGap: boolean | AxialDirection[];
	/**
	 * Enable margin control UI for all or specified element directions
	 *
	 * (default) false
	 */
	margin: boolean | CSSDirection[];

	/**
	 * Enable padding control UI for all or specified element directions
	 *
	 * (default) false
	 */
	padding: boolean | CSSDirection[];

	/**
	 * TODO Undocumented
	 *
	 * Used in [private-selectors.js]()./store/private-selectors.js)
	 *
	 * @internal
	 */
	__experimentalSkipSerialization?: true | string[];
}

/**
 * Interface to allow alternative styles to be applied to existing blocks.
 *
 * Works by adding a className to the block’s wrapper. This className can be used to provide
 * an alternative styling for the block if the block style is selected.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/ Styles} on developer.wordpress.org
 * @public
 */
export interface BlockStyle {
	name: string;
	label: string;
	isDefault?: boolean;
}

/**
 * Description of {@link BlockType} support for editor features.
 *
 * @see {@link BlockType.supports}
 * @public
 */
export interface BlockSupports {
	/**
	 * This property adds block controls which allow to change block's
	 * alignment.
	 *
	 * (default) false
	 */
	align?: boolean | BlockAlignment[];

	/**
	 * Enable wide alignment (depends on `align`).
	 *
	 * (default) true
	 */
	alignWide?: boolean;

	/**
	 * Anchors let you link directly to a specific block on a page. This
	 * property adds a field to define an id for the block and a button to
	 * copy the direct link.
	 *
	 * (default) false
	 */
	anchor?: boolean;

	/**
	 * This value signals that a block supports some of the properties
	 * related to color. When it does, the block editor will show
	 * UI controls for the user to set their values.
	 *
	 * NOTE: The `background` and `text` keys have a default value
	 * of `true`, so if the color property is present they’ll also
	 * be considered enabled.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#color BlockSupports.color} on developer.wordpress.org
	 */
	color?: Partial< ColorProps >;

	/**
	 * This property adds a field to define a custom className for the
	 * block's wrapper.
	 *
	 * (default) true
	 */
	customClassName?: boolean;

	/**
	 * By default, Gutenberg adds a class with the form
	 * `.wp-block-your-block-name` to the root element of your saved
	 * markup.
	 *
	 * (default) true
	 */
	className?: boolean;

	/**
	 * By default, Gutenberg will allow a block's markup to be edited
	 * individually. To disable this behavior, set `html` to `false`
	 *
	 * (default) true
	 */
	html?: boolean;

	/**
	 * By default, all blocks will appear in the Gutenberg inserter. To
	 * hide a block so that it can only be inserted programmatically, set
	 * to false
	 *
	 * (default) true
	 */
	inserter?: boolean;

	/**
	 * A non-multiple block can be inserted into each post, one time only.
	 *
	 * (default) true
	 */
	multiple?: boolean;

	/**
	 * By default all blocks can be converted to a reusable block.
	 *
	 * (default) true
	 */
	reusable?: boolean;

	/**
	 * This value signals that a block supports some of the CSS style
	 * properties related to spacing.
	 *
	 * When the block declares support for a specific spacing property,
	 * the attributes definition is extended to include the `style` attribute.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#spacing BlockSupports.spacing} on developer.wordpress.org
	 */
	spacing?: Partial< SpacingProps >;

	/**
	 * A block may want to disable the ability to toggle the lock state.
	 * It can be locked/unlocked by a user from the block “Options”
	 * dropdown by default. To disable this behavior, set `lock` to `false`.
	 *
	 * (default) true
	 */
	lock?: boolean;

	/**
	 * A block may want to disable the ability to toggle the lock state.
	 * It can be locked/unlocked by a user from the block “Options”
	 * dropdown by default. To disable this behavior, set `lock` to `false`.
	 */
	typography?: Partial< TypographyProps >;

	/**
	 * TODO Undocumented
	 *
	 * Used in [private-selector.js](./store/private-selector.js)
	 */
	shadow: any;

	/**
	 * This value signals that a block supports some of the CSS style properties related to
	 * dimensions.
	 *
	 * (default) null
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#dimensions BlockSupports.dimensions} on developer.wordpress.org
	 */
	dimensions: BlockDimensions;

	/**
	 * This value signals that a block supports some of the CSS style properties related to position.
	 *
	 * (default) null
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#position BlockSupports.position} on developer.wordpress.org
	 */
	position: BlockPosition;

	/**
	 * TODO Undocumented
	 *
	 * @internal
	 */
	__experimentalSelector: any;
}
