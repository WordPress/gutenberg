import { describe, expect, it } from 'vitest';
import {
	cssSetsProperty,
	getCSSNotes,
	getOriginPhrase,
	getStyleSettings,
	getStylesLayer,
	isFromUserStyles,
	isSetOnBlock,
	stylesheetSetsProperty,
} from '../style-origins';

const setting = ( label ) =>
	getStyleSettings().find( ( entry ) => entry.label === label );

const names = {
	blockTitle: 'Pullquote',
	variationLabel: 'Outline',
	element: 'h2',
	getTitle: ( blockName ) =>
		( { 'core/group': 'Group' } )[ blockName ] ?? blockName,
};

describe( 'isSetOnBlock', () => {
	it( 'counts preset attributes and style values', () => {
		expect( isSetOnBlock( { fontSize: 'large' }, setting( 'Size' ) ) ).toBe(
			true
		);
		expect(
			isSetOnBlock(
				{ style: { spacing: { padding: { top: '1rem' } } } },
				setting( 'Padding' )
			)
		).toBe( true );
	} );

	it( 'ignores empty values', () => {
		expect(
			isSetOnBlock(
				{ style: { spacing: { padding: { top: '' } } } },
				setting( 'Padding' )
			)
		).toBe( false );
		expect( isSetOnBlock( undefined, setting( 'Font' ) ) ).toBe( false );
	} );
} );

describe( 'getStylesLayer', () => {
	it( 'returns the highest-precedence layer under any of the paths', () => {
		expect(
			getStylesLayer(
				{
					'spacing.padding.top': { layer: 'root' },
					'spacing.padding.left': { layer: 'block' },
				},
				[ 'spacing.padding' ]
			)
		).toBe( 'block' );
	} );

	it( 'does not match a path that only shares a prefix', () => {
		expect(
			getStylesLayer( { 'color.textShadow': { layer: 'root' } }, [
				'color.text',
			] )
		).toBeUndefined();
	} );
} );

describe( 'isFromUserStyles', () => {
	const user = {
		typography: { fontSize: '20px' },
		elements: { h2: { typography: { fontWeight: '700' } } },
		blocks: {
			'core/button': {
				variations: { outline: { border: { width: '2px' } } },
			},
		},
	};

	it( 'checks the tree the layer keeps its values in', () => {
		expect(
			isFromUserStyles( user, 'root', [ 'typography.fontSize' ], 'x' )
		).toBe( true );
		expect(
			isFromUserStyles(
				user,
				'element',
				[ 'typography.fontWeight' ],
				'core/heading',
				null,
				[ 'heading', 'h2' ]
			)
		).toBe( true );
		expect(
			isFromUserStyles(
				user,
				'blockVariation',
				[ 'border.width' ],
				'core/button',
				'outline'
			)
		).toBe( true );
	} );

	it( 'is false for values only the theme sets', () => {
		expect(
			isFromUserStyles(
				user,
				'block',
				[ 'typography.fontSize' ],
				'core/pullquote'
			)
		).toBe( false );
		expect(
			isFromUserStyles( undefined, 'root', [ 'color.text' ], 'x' )
		).toBe( false );
	} );
} );

describe( 'custom CSS', () => {
	it( 'matches a property and its side longhands, not lookalikes', () => {
		expect( cssSetsProperty( 'padding-top: 0;', [ 'padding' ] ) ).toBe(
			true
		);
		expect( cssSetsProperty( 'border-radius: 0;', [ 'border' ] ) ).toBe(
			false
		);
		expect( cssSetsProperty( 'color: red;', [ 'color' ] ) ).toBe( true );
		expect( cssSetsProperty( 'background-color: red;', [ 'color' ] ) ).toBe(
			false
		);
	} );

	it( 'only counts site-wide rules that name the block', () => {
		const css =
			'.wp-block-pullquote { font-size: 2rem; } .wp-block-pullquote-x { color: red; }';
		expect(
			stylesheetSetsProperty( css, [ 'font-size' ], 'core/pullquote' )
		).toBe( true );
		expect(
			stylesheetSetsProperty( css, [ 'color' ], 'core/pullquote' )
		).toBe( false );
	} );

	it( 'lists each CSS source that sets the setting', () => {
		expect(
			getCSSNotes(
				setting( 'Size' ),
				'core/pullquote',
				'Pullquote',
				'font-size: 3rem;',
				{
					blocks: { 'core/pullquote': { css: 'font-size: 2rem;' } },
					css: '.wp-block-pullquote { font-size: 1rem; }',
				}
			)
		).toEqual( [
			'This block’s Additional CSS also sets it.',
			'Additional CSS for Pullquote blocks in Styles also sets it.',
			'The site’s Additional CSS also sets it.',
		] );
	} );

	it( 'names CSS as the source when nothing else sets it', () => {
		expect(
			getCSSNotes(
				setting( 'Letter case' ),
				'core/paragraph',
				'Paragraph',
				'text-transform: uppercase;',
				{},
				false
			)
		).toEqual( [ 'Set by this block’s Additional CSS.' ] );
	} );
} );

describe( 'getOriginPhrase', () => {
	it( 'names theme and Styles layers apart', () => {
		expect(
			getOriginPhrase(
				{ type: 'styles', layer: 'root', fromUser: false },
				names
			)
		).toBe( 'the theme' );
		expect(
			getOriginPhrase(
				{ type: 'styles', layer: 'block', fromUser: true },
				names
			)
		).toBe( 'the site’s Styles for Pullquote blocks' );
		expect(
			getOriginPhrase(
				{ type: 'styles', layer: 'element', fromUser: false },
				names
			)
		).toBe( 'the theme’s styles for headings' );
		expect(
			getOriginPhrase(
				{ type: 'styles', layer: 'blockVariation', fromUser: false },
				names
			)
		).toBe( 'the theme’s Outline style' );
	} );

	it( 'names a parent block and where the parent gets it', () => {
		expect(
			getOriginPhrase(
				{ type: 'parent', parentName: 'core/group', via: 'block' },
				names
			)
		).toBe( 'the Group block it is inside' );
		expect(
			getOriginPhrase(
				{ type: 'parent', parentName: 'core/group', via: 'theme' },
				names
			)
		).toBe(
			'the Group block it is inside, which gets it from the theme’s styles for Group blocks'
		);
	} );
} );
