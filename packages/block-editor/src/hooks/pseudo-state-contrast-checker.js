/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, Platform } from '@wordpress/element';
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ContrastChecker from '../components/contrast-checker';
import { COLOR_SUPPORT_KEY } from './color';
import { store as blockEditorStore } from '../store';
import { getColorObjectByAttributeValues } from '../components/colors';
import { useSettings } from '../components/use-settings';

/**
 * Resolves a CSS custom property like `var:preset|color|slug` or a raw hex
 * value to a concrete hex string that `ContrastChecker` can consume.
 *
 * @param {string|undefined} value  Raw value from theme.json style object.
 * @param {Array}            colors Merged palette (user → theme → default).
 * @return {string|undefined}        Resolved hex color, or `undefined`.
 */
function resolveColorValue( value, colors ) {
	if ( ! value ) {
		return undefined;
	}
	// Preset variable format: 'var:preset|color|<slug>'
	if ( value.startsWith( 'var:preset|color|' ) ) {
		const slug = value.slice( 'var:preset|color|'.length );
		return getColorObjectByAttributeValues( colors, slug )?.color;
	}
	// Plain hex / rgb / named color — pass through as-is.
	return value;
}

/**
 * Merge a pseudo-state color object with the default state's color object so
 * that any property the pseudo-state leaves unset falls back to the default.
 *
 * @param {Object|undefined} pseudoStateColor e.g. style.elements.link[':hover'].color
 * @param {Object|undefined} defaultColor     e.g. style.color (the block's default)
 * @return {{ text: string|undefined, background: string|undefined }} Merged
 *                                                                   color object with pseudo-state values overriding defaults.
 */
function mergeWithFallback( pseudoStateColor, defaultColor ) {
	return {
		text:
			pseudoStateColor?.text !== undefined
				? pseudoStateColor.text
				: defaultColor?.text,
		background:
			pseudoStateColor?.background !== undefined
				? pseudoStateColor.background
				: defaultColor?.background,
	};
}

/**
 * Extracts the color object for a given pseudo-state from `style.elements`.
 *
 * For block-level pseudo-states such as `:hover`, `:focus`, `:focus-visible`,
 * and `:active`, Gutenberg stores the overrides inside:
 *
 *   style.elements.link[':hover'].color   (for link elements)
 *   style[':hover'].color                 (for block root pseudo-states)
 *
 * PR #76491 introduced a unified `activePseudoState` concept that adds the
 * state as a key directly on the block's style object.  We try both locations
 * so the checker works regardless of which nesting convention was used.
 *
 * @param {Object} style       Full block style attribute.
 * @param {string} pseudoState One of ':hover', ':focus', ':focus-visible', ':active'.
 * @return {Object|undefined}      Color sub-object for that state, if any.
 */
function getPseudoStateColor( style, pseudoState ) {
	if ( ! style || ! pseudoState ) {
		return undefined;
	}
	// Convention 1: style[':hover'].color  (block-root pseudo-state)
	const rootStateColor = style[ pseudoState ]?.color;
	if ( rootStateColor ) {
		return rootStateColor;
	}
	// Convention 2: style.elements.link[':hover'].color  (link element)
	const linkStateColor = style?.elements?.link?.[ pseudoState ]?.color;
	if ( linkStateColor ) {
		return linkStateColor;
	}
	return undefined;
}

/**
 * `PseudoStateContrastChecker` renders a `<ContrastChecker>` notice when the
 * user is editing a pseudo-state color panel (e.g. the ":hover" state of a
 * Button block's colors).
 *
 * **Problem being solved** (issue #78305):
 *
 * The existing `BlockColorContrastChecker` works by querying `getComputedStyle`
 * on the live canvas DOM element.  When the user is editing the *default* state
 * this is fine — the computed styles reflect the current colors.  But when
 * editing a pseudo-state (`:hover`, `:focus`, etc.) the canvas element is in
 * its *resting* state; the pseudo-state CSS rules are never applied unless the
 * user physically hovers the element.  So `getComputedStyle` always returns
 * the default-state colors and the contrast check is silently skipped.
 *
 * **Solution**:
 *
 * For pseudo-state panels, read colors **directly from the block's style
 * attribute** rather than from the DOM.  Any color the pseudo-state leaves
 * unset is inherited from the default state (also read from attributes).
 * The resolved values are passed as props to the pure `<ContrastChecker>`
 * component which performs the WCAG 2.0 AA ratio check.
 *
 * **False-hover guard** (described in #78305):
 *
 * When the user is editing the *default* state and physically hovers the block
 * canvas the DOM's `:hover` pseudo-class fires, which used to cause the DOM-
 * based checker to read hover-state colors and show spurious warnings.  Because
 * this component is *only* rendered for genuine pseudo-state panels (when
 * `activePseudoState` is set), it never runs in the default-state context,
 * eliminating the false-positive case entirely.
 *
 * @param {Object} props
 * @param {string} props.clientId          Block client ID.
 * @param {string} props.name              Block name (for support checks).
 * @param {string} props.activePseudoState One of ':hover', ':focus',
 *                                         ':focus-visible', ':active'.
 * @return {Object|null} Contrast checker UI element for the active pseudo-state,
 *                       or `null` when checking is not applicable.
 */
export default function PseudoStateContrastChecker( {
	clientId,
	name,
	activePseudoState,
} ) {
	// Only run on web; skip if there is no active pseudo-state.
	if ( Platform.OS !== 'web' || ! activePseudoState ) {
		return null;
	}

	// Respect the block's `enableContrastChecker` support flag (same guard as
	// in ColorEdit for the default-state checker).
	const contrastCheckerEnabled =
		false !==
		getBlockSupport( name, [ COLOR_SUPPORT_KEY, 'enableContrastChecker' ] );

	if ( ! contrastCheckerEnabled ) {
		return null;
	}

	return (
		<PseudoStateContrastCheckerInner
			clientId={ clientId }
			activePseudoState={ activePseudoState }
		/>
	);
}

/**
 * Inner component that hooks into the store — keeps the outer component free
 * of conditional hook calls.
 *
 * @param {Object} props
 * @param {string} props.clientId
 * @param {string} props.activePseudoState
 * @return {Object|null} Contrast checker notice element for resolved pseudo-state
 *                       colors, or `null` when colors are unavailable.
 */
function PseudoStateContrastCheckerInner( { clientId, activePseudoState } ) {
	// Load the merged color palette (user overrides > theme > defaults).
	const [ userPalette, themePalette, defaultPalette ] = useSettings(
		'color.palette.custom',
		'color.palette.theme',
		'color.palette.default'
	);

	const colors = useMemo(
		() => [
			...( userPalette || [] ),
			...( themePalette || [] ),
			...( defaultPalette || [] ),
		],
		[ userPalette, themePalette, defaultPalette ]
	);

	// Read the full style attribute from the block.
	const style = useSelect(
		( select ) => {
			return (
				select( blockEditorStore ).getBlockAttributes( clientId )
					?.style ?? {}
			);
		},
		[ clientId ]
	);

	// Resolve the effective text and background colors for the active
	// pseudo-state, falling back to the block's default-state colors.
	const { textColor, backgroundColor } = useMemo( () => {
		// Default-state colors (the block's own style.color).
		const defaultColor = style?.color;

		// Pseudo-state overrides (may be partial or absent).
		const pseudoStateColor = getPseudoStateColor(
			style,
			activePseudoState
		);

		// Merge: pseudo-state wins for any property it defines; default fills gaps.
		const merged = mergeWithFallback( pseudoStateColor, defaultColor );

		return {
			textColor: resolveColorValue( merged.text, colors ),
			backgroundColor: resolveColorValue( merged.background, colors ),
		};
	}, [ style, activePseudoState, colors ] );

	// If neither color is resolved there is nothing meaningful to check.
	if ( ! textColor && ! backgroundColor ) {
		return null;
	}

	return (
		<ContrastChecker
			textColor={ textColor }
			backgroundColor={ backgroundColor }
		/>
	);
}
