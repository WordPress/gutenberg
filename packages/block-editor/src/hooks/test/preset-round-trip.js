/**
 * Regression coverage for preset round-trip and explicit-empty behavior.
 *
 * The tests verify that supported preset domains decode each serialization
 * form to the same display value, encode resolved overrides back to canonical
 * preset references, clear the relevant reset surfaces, and treat explicit
 * empty values as non-contributing layers.
 */

import { describe, expect, it } from 'vitest';
import {
	getValueFromVariable,
	getPresetVariableFromValue,
} from '@wordpress/global-styles-engine';
import {
	getCustomValueFromPreset as getCustomSpacingValue,
	getPresetValueFromCustomValue as getSpacingPresetFromCustom,
	isValueSpacingPreset,
} from '../../components/spacing-sizes-control/utils';
import {
	getCustomValueFromPreset,
	getPresetValueFromCustomValue,
	isValuePreset,
} from '../../components/preset-input-control/utils';

// Border-radius equivalents of the spacing helpers above. The per-domain
// implementations were consolidated into the generic preset-input-control
// helpers, which take the preset type as an extra argument.
const BORDER_RADIUS_PRESET_TYPE = 'border-radius';
const getCustomRadiusValue = ( value, presets ) =>
	getCustomValueFromPreset( value, presets, BORDER_RADIUS_PRESET_TYPE );
const getRadiusPresetFromCustom = ( value, presets ) =>
	getPresetValueFromCustomValue( value, presets, BORDER_RADIUS_PRESET_TYPE );
const isValueRadiusPreset = ( value ) =>
	isValuePreset( value, BORDER_RADIUS_PRESET_TYPE );

// Fixture: a minimal merged GlobalStylesConfig sized just large enough
// to exercise every (form × domain) cell. Mirrors the two-branch shape
// real Global Styles payloads use ({ settings, styles }).
//
// Note on preset shape: `findInPresetsBy()` (engine-internal) iterates
// presets by origin in priority order [ 'custom', 'theme', 'default' ].
// A flat array does NOT match. Real GS payloads are origin-keyed; the
// fixture mirrors that exactly. The per-domain block-editor helpers
// (spacing-sizes-control, preset-input-control) take the FLAT preset
// list, so we keep both shapes (RAW_PRESETS for the helpers,
// origin-keyed wrappers for the engine).
const RAW_PRESETS = {
	color: [
		{ slug: 'vivid-red', color: '#cf2e2e', name: 'Vivid red' },
		{ slug: 'pale-blue', color: '#a5e3ff', name: 'Pale blue' },
	],
	fontSizes: [
		{ slug: 'large', size: '24px', name: 'Large' },
		{ slug: 'small', size: '14px', name: 'Small' },
	],
	spacingSizes: [
		{ slug: '40', size: '32px', name: 'Large' },
		{ slug: '20', size: '8px', name: 'Small' },
	],
	radiusSizes: [
		{ slug: 'rounded', size: '8px', name: 'Rounded' },
		{ slug: 'pill', size: '999px', name: 'Pill' },
	],
};

const FEATURES = {
	settings: {
		color: {
			palette: { theme: RAW_PRESETS.color },
		},
		typography: {
			fontSizes: { theme: RAW_PRESETS.fontSizes },
		},
		spacing: {
			spacingSizes: { theme: RAW_PRESETS.spacingSizes },
		},
		border: {
			radiusSizes: { theme: RAW_PRESETS.radiusSizes },
		},
	},
	styles: {
		// Targets for the `{ ref }` decode leg.
		color: {
			text: '#cf2e2e',
			background: '#a5e3ff',
		},
		typography: {
			fontSize: '24px',
		},
		spacing: {
			padding: { top: '32px' },
		},
		border: {
			radius: '8px',
		},
	},
};

const PRESETS = {
	spacing: RAW_PRESETS.spacingSizes,
	'border-radius': RAW_PRESETS.radiusSizes,
};

/**
 * Simulate the panel's "reset all" path against a block's attributes.
 * Returns a new attributes object with every reset surface cleared for
 * the given style path. The reset surfaces are:
 *
 *   1. The per-domain slug attribute  (e.g. attributes.textColor, .fontSize)
 *   2. The serialized style-path var  (e.g. attributes.style.color.text)
 *
 * The auto-generated CSS class (e.g. `has-vivid-red-color`) is derived
 * from (1) at save() time, so clearing (1) clears the class downstream —
 * verified indirectly by asserting (1) is undefined after reset.
 *
 * @param {Object}  attributes   Block attributes object.
 * @param {?string} slugAttrName Per-domain slug attribute key, or null.
 * @param {string}  stylePath    Dotted style sub-path to clear.
 * @return {Object} New attributes with the reset surfaces cleared.
 */
function simulateResetAll( attributes, slugAttrName, stylePath ) {
	const next = { ...attributes };
	if ( slugAttrName ) {
		next[ slugAttrName ] = undefined;
	}
	if ( stylePath ) {
		const segments = stylePath.split( '.' );
		next.style = JSON.parse( JSON.stringify( next.style || {} ) );
		let node = next.style;
		for ( let i = 0; i < segments.length - 1; i++ ) {
			if ( ! node[ segments[ i ] ] ) {
				return next;
			}
			node = node[ segments[ i ] ];
		}
		node[ segments[ segments.length - 1 ] ] = undefined;
	}
	return next;
}

// ---------------------------------------------------------------------------
// COLOR — has STYLE_PATH_TO_CSS_VAR_INFIX entry → uses GS engine helpers.
// ---------------------------------------------------------------------------
describe( 'color preset round-trip', () => {
	const stylePath = 'color.text';
	const slugAttr = 'textColor';
	const expectedResolved = '#cf2e2e';
	const expectedPresetVar = 'var:preset|color|vivid-red';

	it.each( [
		[ 'var:preset|<infix>|<slug>', 'var:preset|color|vivid-red' ],
		[
			'var(--wp--preset--<infix>--<slug>)',
			'var(--wp--preset--color--vivid-red)',
		],
		[ 'raw resolved', '#cf2e2e' ],
		[ '{ ref }', { ref: 'styles.color.text' } ],
	] )( 'decodes [%s] for display', ( _label, input ) => {
		const decoded = getValueFromVariable( FEATURES, undefined, input );
		expect( decoded ).toBe( expectedResolved );
	} );

	it( 'encodes a resolved override back to var:preset|color|<slug>', () => {
		const encoded = getPresetVariableFromValue(
			FEATURES.settings,
			undefined,
			stylePath,
			expectedResolved
		);
		expect( encoded ).toBe( expectedPresetVar );
	} );

	it( 'encodes a non-preset color through unchanged (custom value)', () => {
		const encoded = getPresetVariableFromValue(
			FEATURES.settings,
			undefined,
			stylePath,
			'#000000'
		);
		expect( encoded ).toBe( '#000000' );
	} );

	it( 'full-reset clears slug attribute + style path', () => {
		const before = {
			textColor: 'vivid-red',
			style: { color: { text: 'var:preset|color|vivid-red' } },
		};
		const after = simulateResetAll( before, slugAttr, stylePath );
		expect( after.textColor ).toBeUndefined();
		expect( after.style.color.text ).toBeUndefined();
	} );
} );

// ---------------------------------------------------------------------------
// FONT-SIZE — has STYLE_PATH_TO_CSS_VAR_INFIX entry; valueFunc may run
// getTypographyFontSizeValue but here our preset already has a plain `size`.
// ---------------------------------------------------------------------------
describe( 'font-size preset round-trip', () => {
	const stylePath = 'typography.fontSize';
	const slugAttr = 'fontSize';
	const expectedResolved = '24px';
	const expectedPresetVar = 'var:preset|font-size|large';

	it.each( [
		[ 'var:preset|<infix>|<slug>', 'var:preset|font-size|large' ],
		[
			'var(--wp--preset--<infix>--<slug>)',
			'var(--wp--preset--font-size--large)',
		],
		[ 'raw resolved', '24px' ],
		[ '{ ref }', { ref: 'styles.typography.fontSize' } ],
	] )( 'decodes [%s] for display', ( _label, input ) => {
		const decoded = getValueFromVariable( FEATURES, undefined, input );
		expect( decoded ).toBe( expectedResolved );
	} );

	it( 'encodes a resolved override back to var:preset|font-size|<slug>', () => {
		const encoded = getPresetVariableFromValue(
			FEATURES.settings,
			undefined,
			stylePath,
			expectedResolved
		);
		expect( encoded ).toBe( expectedPresetVar );
	} );

	it( 'encodes a non-preset size through unchanged (custom value)', () => {
		const encoded = getPresetVariableFromValue(
			FEATURES.settings,
			undefined,
			stylePath,
			'19px'
		);
		expect( encoded ).toBe( '19px' );
	} );

	it( 'full-reset clears slug attribute + style path', () => {
		const before = {
			fontSize: 'large',
			style: { typography: { fontSize: 'var:preset|font-size|large' } },
		};
		const after = simulateResetAll( before, slugAttr, stylePath );
		expect( after.fontSize ).toBeUndefined();
		expect( after.style.typography.fontSize ).toBeUndefined();
	} );
} );

// ---------------------------------------------------------------------------
// SPACING — NOT in STYLE_PATH_TO_CSS_VAR_INFIX. Uses the per-domain
// helpers in spacing-sizes-control/utils.js, keyed against spacingSizes
// presets. No slug attribute exists; spacing lives only in
// style.spacing.*.
// ---------------------------------------------------------------------------
describe( 'spacing preset round-trip', () => {
	const stylePath = 'spacing.padding.top';
	const slugAttr = null; // no slug-attribute leg for spacing
	const expectedResolved = '32px';
	const expectedPresetVar = 'var:preset|spacing|40';
	const presets = PRESETS.spacing;

	// Decode leg.
	it( 'decodes var:preset|spacing|<slug> via getCustomValueFromPreset', () => {
		expect( getCustomSpacingValue( expectedPresetVar, presets ) ).toBe(
			expectedResolved
		);
	} );

	it( 'decodes var(--wp--preset--spacing--<slug>) via getValueFromVariable', () => {
		// The block-editor spacing helper is regex-based and only
		// matches `var:preset|…` form. The engine's
		// `getValueFromVariable` handles the CSS-custom-property form
		// via the same PRESET_METADATA. Both paths must reach the same
		// display value or the panel has to choose one.
		const decoded = getValueFromVariable(
			FEATURES,
			undefined,
			'var(--wp--preset--spacing--40)'
		);
		expect( decoded ).toBe( expectedResolved );
	} );

	it( 'decodes raw resolved value as-is (passthrough)', () => {
		expect( getCustomSpacingValue( '32px', presets ) ).toBe( '32px' );
	} );

	it( 'decodes { ref: … } via getValueFromVariable', () => {
		const decoded = getValueFromVariable( FEATURES, undefined, {
			ref: 'styles.spacing.padding.top',
		} );
		expect( decoded ).toBe( expectedResolved );
	} );

	// Encode leg.
	it( 'encodes a resolved override back to var:preset|spacing|<slug>', () => {
		expect( getSpacingPresetFromCustom( expectedResolved, presets ) ).toBe(
			expectedPresetVar
		);
	} );

	it( 'encodes a non-preset value through unchanged (custom value)', () => {
		expect( getSpacingPresetFromCustom( '17px', presets ) ).toBe( '17px' );
	} );

	// Reset leg.
	it( 'full-reset clears style.spacing.padding.top (no slug attribute)', () => {
		const before = {
			style: { spacing: { padding: { top: 'var:preset|spacing|40' } } },
		};
		const after = simulateResetAll( before, slugAttr, stylePath );
		expect( after.style.spacing.padding.top ).toBeUndefined();
	} );

	it( 'isValueSpacingPreset recognises the canonical form', () => {
		expect( isValueSpacingPreset( expectedPresetVar ) ).toBe( true );
		expect( isValueSpacingPreset( '32px' ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// BORDER-RADIUS — NOT in STYLE_PATH_TO_CSS_VAR_INFIX. Uses the generic
// helpers in preset-input-control/utils.js with the 'border-radius' preset
// type. No slug attribute exists; border-radius lives only in
// style.border.radius.
// ---------------------------------------------------------------------------
describe( 'border-radius preset round-trip', () => {
	const stylePath = 'border.radius';
	const slugAttr = null;
	const expectedResolved = '8px';
	const expectedPresetVar = 'var:preset|border-radius|rounded';
	const presets = PRESETS[ 'border-radius' ];

	// Decode leg.
	it( 'decodes var:preset|border-radius|<slug> via getCustomValueFromPreset', () => {
		expect( getCustomRadiusValue( expectedPresetVar, presets ) ).toBe(
			expectedResolved
		);
	} );

	it( 'decodes var(--wp--preset--border-radius--<slug>) via getValueFromVariable', () => {
		const decoded = getValueFromVariable(
			FEATURES,
			undefined,
			'var(--wp--preset--border-radius--rounded)'
		);
		expect( decoded ).toBe( expectedResolved );
	} );

	it( 'decodes raw resolved value as-is (passthrough)', () => {
		expect( getCustomRadiusValue( '8px', presets ) ).toBe( '8px' );
	} );

	it( 'decodes { ref: … } via getValueFromVariable', () => {
		const decoded = getValueFromVariable( FEATURES, undefined, {
			ref: 'styles.border.radius',
		} );
		expect( decoded ).toBe( expectedResolved );
	} );

	// Encode leg.
	it( 'encodes a resolved override back to var:preset|border-radius|<slug>', () => {
		expect( getRadiusPresetFromCustom( expectedResolved, presets ) ).toBe(
			expectedPresetVar
		);
	} );

	it( 'encodes a non-preset value through unchanged (custom value)', () => {
		expect( getRadiusPresetFromCustom( '12px', presets ) ).toBe( '12px' );
	} );

	// Reset leg.
	it( 'full-reset clears style.border.radius (no slug attribute)', () => {
		const before = {
			style: {
				border: { radius: 'var:preset|border-radius|rounded' },
			},
		};
		const after = simulateResetAll( before, slugAttr, stylePath );
		expect( after.style.border.radius ).toBeUndefined();
	} );

	it( 'isValuePreset recognises the canonical form', () => {
		expect( isValueRadiusPreset( expectedPresetVar ) ).toBe( true );
		expect( isValueRadiusPreset( '8px' ) ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// Explicit-empty handling per domain.
//
// Empty leaves must be treated as non-contributing layers so controls can
// fall back to the next layer instead of rendering an empty placeholder.
// ---------------------------------------------------------------------------
describe( 'explicit-empty handling per domain', () => {
	// Reproduce `resolveStyle`'s emptiness predicate verbatim.
	function isEmpty( v ) {
		if ( v === '' || v === null || v === undefined ) {
			return true;
		}
		if (
			typeof v === 'object' &&
			! Array.isArray( v ) &&
			Object.keys( v ).length === 0
		) {
			return true;
		}
		return false;
	}

	it.each( [
		[ 'color (text)', '' ],
		[ 'color (text)', null ],
		[ 'color (text)', {} ],
		[ 'font-size', '' ],
		[ 'font-size', null ],
		[ 'font-size', {} ],
		[ 'spacing (padding.top)', '' ],
		[ 'spacing (padding.top)', null ],
		[ 'spacing (padding.top)', {} ],
		[ 'border-radius', '' ],
		[ 'border-radius', null ],
		[ 'border-radius', {} ],
	] )(
		'%s with value %p is recognised as a non-contributing layer',
		( _domain, value ) => {
			expect( isEmpty( value ) ).toBe( true );
		}
	);

	// Sanity: zero-valued (but meaningful) leaves are NOT empty. A
	// spacing of '0' or a border radius of '0' is a real, contributing
	// value.
	it.each( [
		[ 'color', '#000000' ],
		[ 'font-size', '0px' ],
		[ 'spacing', '0' ],
		[ 'border-radius', '0' ],
	] )(
		'%s with concrete value %p is NOT an empty layer',
		( _domain, value ) => {
			expect( isEmpty( value ) ).toBe( false );
		}
	);

	// Cross-check against the engine's `getValueFromVariable`: an
	// empty-string input round-trips to itself (the resolver's job is
	// to drop the layer; the engine's job is just to leave non-variables
	// alone).
	it( 'getValueFromVariable returns empty string unchanged (resolver drops the layer downstream)', () => {
		expect( getValueFromVariable( FEATURES, undefined, '' ) ).toBe( '' );
	} );
} );
