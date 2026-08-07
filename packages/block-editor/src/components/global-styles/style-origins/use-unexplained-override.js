/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { getTypographyFontSizeValue } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useBlockElement } from '../../block-list/use-block-props/use-block-refs';
import { store as blockEditorStore } from '../../../store';

/**
 * Style paths whose winning value can be checked against what the browser
 * actually computed. Restricted to properties that map cleanly onto a single
 * CSS property; shorthands and object-valued styles (background images,
 * gradients, shadows) are left out because a mismatch there would be noise
 * rather than signal.
 */
const CSS_PROPERTY_BY_PATH = {
	'typography.fontSize': 'fontSize',
	'typography.fontWeight': 'fontWeight',
	'typography.fontStyle': 'fontStyle',
	'typography.fontFamily': 'fontFamily',
	'typography.lineHeight': 'lineHeight',
	'typography.letterSpacing': 'letterSpacing',
	'typography.textTransform': 'textTransform',
	'typography.textDecoration': 'textDecorationLine',
	'typography.textAlign': 'textAlign',
	'color.text': 'color',
	'color.background': 'backgroundColor',
	'border.radius': 'borderTopLeftRadius',
	'border.width': 'borderTopWidth',
	'border.style': 'borderTopStyle',
	'border.color': 'borderTopColor',
};

/**
 * Turns a stored preset reference into the custom property the stylesheet uses,
 * so it can be resolved by the browser like any other value.
 *
 * @param {*} value Raw style value.
 * @return {*} A value safe to assign to a CSS property.
 */
function toCssValue( value ) {
	if ( typeof value !== 'string' ) {
		return value;
	}
	const preset = value.match( /^var:preset\|([a-z-]+)\|(.+)$/i );
	return preset
		? `var(--wp--preset--${ preset[ 1 ] }--${ preset[ 2 ] })`
		: value;
}

/**
 * Detects a value that the browser resolved differently from what Global Styles
 * says should win.
 *
 * The cascade this feature explains covers the Global Styles data model only.
 * Custom CSS (excluded from the engine outright), theme stylesheets, plugin
 * styles and Customizer CSS all sit outside it and can still win on the page.
 * Without this check the popover would state a winner with full confidence
 * while the block visibly renders as something else.
 *
 * The expected value is normalised by applying it to a probe element mounted in
 * the block's own parent, so relative units, custom properties and inherited
 * context resolve the same way they do for the block itself. Only a difference
 * after that normalisation counts.
 *
 * @param {?string} clientId      Selected block client ID.
 * @param {?string} stylePath     Dot-path of the property.
 * @param {*}       expectedValue The value the cascade says should win.
 * @param {?string} layer         Which layer won, so values that bypass the
 *                                style pipeline are compared verbatim.
 * @return {boolean} Whether something outside Global Styles is overriding it.
 */
export function useUnexplainedOverride(
	clientId,
	stylePath,
	expectedValue,
	layer
) {
	const element = useBlockElement( clientId );
	const [ isOverridden, setIsOverridden ] = useState( false );

	// Authored values are not always what gets emitted. With fluid typography
	// on, WordPress rewrites a font size into a `clamp()` before it reaches the
	// stylesheet, so comparing the authored value against the computed one
	// reports a mismatch on every font size. Run the same transform first.
	const features = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().__experimentalFeatures,
		[]
	);

	useEffect( () => {
		const cssProperty = CSS_PROPERTY_BY_PATH[ stylePath ];
		if (
			! element ||
			! cssProperty ||
			expectedValue === undefined ||
			expectedValue === null
		) {
			setIsOverridden( false );
			return;
		}

		const ownerDocument = element.ownerDocument;
		const view = ownerDocument?.defaultView;
		const parent = element.parentElement;
		if ( ! view || ! parent ) {
			setIsOverridden( false );
			return;
		}

		const actual = view.getComputedStyle( element )[ cssProperty ];

		let emitted = expectedValue;
		// Custom CSS is written straight into the stylesheet, so it never goes
		// through the fluid-typography rewrite that block-supports values do.
		// Transforming it here would compare against a value the browser was
		// never given.
		if ( stylePath === 'typography.fontSize' && layer !== 'localCss' ) {
			emitted =
				getTypographyFontSizeValue(
					{ size: expectedValue },
					features ?? {}
				) ?? expectedValue;
		}

		const probe = ownerDocument.createElement( 'div' );
		probe.setAttribute( 'aria-hidden', 'true' );
		probe.style.position = 'absolute';
		probe.style.visibility = 'hidden';
		probe.style.pointerEvents = 'none';
		// Unitless line heights and `em` lengths resolve against the element's
		// own font size, so the probe has to start from the same one.
		if ( cssProperty !== 'fontSize' ) {
			probe.style.fontSize = view.getComputedStyle( element ).fontSize;
		}
		probe.style[ cssProperty ] = toCssValue( emitted );
		parent.appendChild( probe );
		const expected = view.getComputedStyle( probe )[ cssProperty ];
		probe.remove();

		// An unset probe means the value could not be parsed (a `clamp()` the
		// browser rejected, say). Reporting a mismatch from that would be a
		// false alarm, so stay quiet.
		setIsOverridden( !! expected && actual !== expected );
	}, [ element, stylePath, expectedValue, features, layer ] );

	return isOverridden;
}
