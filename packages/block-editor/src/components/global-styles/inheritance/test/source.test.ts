import { describe, expect, it } from 'vitest';
import {
	cssSetsProperty,
	cssTargetsBlock,
	getSourceLayer,
	getStylesCrumb,
	getStylesSection,
} from '../source';

describe( 'getSourceLayer', () => {
	const sources = {
		'typography.fontSize': { layer: 'block' },
		'typography.lineHeight': { layer: 'root' },
		'spacing.padding.top': { layer: 'root' },
		'spacing.padding.left': { layer: 'blockVariation' },
		'color.text': { layer: 'element' },
	};

	it( 'returns the layer for an exact path', () => {
		expect( getSourceLayer( sources, 'typography.fontSize' ) ).toBe(
			'block'
		);
	} );

	it( 'returns the highest-precedence layer under a group path', () => {
		expect( getSourceLayer( sources, 'spacing.padding' ) ).toBe(
			'blockVariation'
		);
	} );

	it( 'combines several paths', () => {
		expect(
			getSourceLayer( sources, [ 'typography.lineHeight', 'color.text' ] )
		).toBe( 'element' );
	} );

	it( 'does not match a path that only shares a prefix', () => {
		expect( getSourceLayer( sources, 'typography.font' ) ).toBeUndefined();
	} );

	it( 'returns undefined without sources', () => {
		expect( getSourceLayer( undefined, 'color.text' ) ).toBeUndefined();
	} );
} );

describe( 'getStylesSection', () => {
	it( 'links a block-type value to its block screen', () => {
		expect(
			getStylesSection( 'block', 'typography.fontSize', 'core/pullquote' )
		).toBe( '/blocks/core%2Fpullquote' );
	} );

	it( 'links a block style variation to its variation screen', () => {
		expect(
			getStylesSection(
				'blockVariation',
				'color.text',
				'core/button',
				'outline'
			)
		).toBe( '/blocks/core%2Fbutton/variations/outline' );
	} );

	it( 'links element typography to the element screen', () => {
		expect(
			getStylesSection(
				'element',
				'typography.lineHeight',
				'core/heading',
				null,
				[ 'heading', 'h2' ]
			)
		).toBe( '/typography/heading' );
		expect(
			getStylesSection(
				'element',
				'typography.fontSize',
				'core/button',
				null,
				[ 'button' ]
			)
		).toBe( '/typography/button' );
	} );

	it( 'links element spacing to the block screen', () => {
		expect(
			getStylesSection(
				'element',
				'spacing.padding',
				'core/button',
				null,
				[ 'button' ]
			)
		).toBe( '/blocks/core%2Fbutton' );
	} );

	it( 'links site-wide text to Typography → Text', () => {
		expect( getStylesSection( 'root', 'typography.fontSize' ) ).toBe(
			'/typography/text'
		);
	} );

	it( 'links site-wide values to their group screen', () => {
		expect( getStylesSection( 'root', 'color.text' ) ).toBe( '/colors' );
		expect( getStylesSection( 'root', 'spacing.padding' ) ).toBe(
			'/layout'
		);
	} );
} );

describe( 'cssTargetsBlock', () => {
	const css =
		'.wp-block-button__link { text-transform: uppercase; }\n.wp-block-heading { word-spacing: 0.1em; }';

	it( 'matches a block class and its BEM children', () => {
		expect( cssTargetsBlock( css, 'core/heading' ) ).toBe( true );
		expect( cssTargetsBlock( css, 'core/button' ) ).toBe( true );
	} );

	it( 'does not match a longer class that starts the same', () => {
		expect( cssTargetsBlock( css, 'core/buttons' ) ).toBe( false );
		expect(
			cssTargetsBlock( '.wp-block-buttons { gap: 0; }', 'core/button' )
		).toBe( false );
	} );

	it( 'does not match blocks the stylesheet never names', () => {
		expect( cssTargetsBlock( css, 'core/paragraph' ) ).toBe( false );
	} );
} );

describe( 'cssSetsProperty', () => {
	it( "matches a block's own declarations for the control's property", () => {
		expect(
			cssSetsProperty(
				'font-size: 18px !important',
				'typography.fontSize'
			)
		).toBe( true );
		expect(
			cssSetsProperty( 'padding-top: 1rem;', 'spacing.padding' )
		).toBe( true );
	} );

	it( 'does not match a property that only ends the same way', () => {
		expect( cssSetsProperty( 'background-color: red', 'color.text' ) ).toBe(
			false
		);
		expect( cssSetsProperty( 'color: red', 'color.text' ) ).toBe( true );
	} );

	it( 'only counts site rules that name the block', () => {
		const css =
			'.wp-block-heading { word-spacing: 0.1em; font-size: 2rem; }\n.wp-block-button__link { text-transform: uppercase; }';
		expect(
			cssSetsProperty( css, 'typography.fontSize', 'core/heading' )
		).toBe( true );
		expect(
			cssSetsProperty( css, 'typography.fontSize', 'core/button' )
		).toBe( false );
		expect(
			cssSetsProperty( css, 'typography.textTransform', 'core/button' )
		).toBe( true );
	} );

	it( 'ignores paths with no CSS property and empty CSS', () => {
		expect( cssSetsProperty( 'width: 1px', 'layout.contentSize' ) ).toBe(
			false
		);
		expect( cssSetsProperty( '', 'typography.fontSize' ) ).toBe( false );
	} );
} );

describe( 'getStylesCrumb', () => {
	it( 'names Styles screens the way their menus read', () => {
		expect( getStylesCrumb( '/typography/heading', '', '' ) ).toBe(
			'Styles → Typography → Headings'
		);
		expect(
			getStylesCrumb( '/blocks/core%2Fheading', 'Heading', '' )
		).toBe( 'Styles → Blocks → Heading' );
		expect(
			getStylesCrumb(
				'/blocks/core%2Fheading/variations/text-display',
				'Heading',
				'Display'
			)
		).toBe( 'Styles → Blocks → Heading → Display' );
		expect( getStylesCrumb( '/css', '', '' ) ).toBe(
			'Styles → Additional CSS'
		);
	} );
} );
