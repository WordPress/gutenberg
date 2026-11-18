import { describe, expect, it } from 'vitest';
import {
	getReferences,
	getSitePartsUsageFromRecords,
	needsPatterns,
} from '../site-parts-usage';

const THEME = 'twentytwentyfive';

const part = ( slug: string, extra = '' ) =>
	`<!-- wp:template-part {"slug":"${ slug }"${ extra }} /-->`;

describe( 'getReferences', () => {
	it( 'lists part, overlay and pattern references in document order', () => {
		const markup = [
			part( 'header' ),
			'<!-- wp:group {"layout":{"type":"constrained"}} --><div>',
			'<!-- wp:navigation {"ref":4,"overlay":"overlay"} /-->',
			'<!-- wp:pattern {"slug":"theme/hero"} /-->',
			'</div><!-- /wp:group -->',
			'<!-- wp:core/template-part {"slug":"footer","theme":"other"} /-->',
		].join( '\n' );

		expect( getReferences( markup, THEME ) ).toEqual( [
			{ type: 'part', id: `${ THEME }//header` },
			{ type: 'part', id: `${ THEME }//overlay` },
			{ type: 'pattern', name: 'theme/hero' },
			{ type: 'part', id: 'other//footer' },
		] );
	} );

	it( 'reads attributes that contain braces', () => {
		const markup =
			'<!-- wp:template-part {"slug":"header","style":{"spacing":{"margin":"0"}}} /-->';

		expect( getReferences( markup, THEME ) ).toEqual( [
			{ type: 'part', id: `${ THEME }//header` },
		] );
	} );

	it( 'keeps an overlay given as a full id', () => {
		expect(
			getReferences(
				'<!-- wp:navigation {"overlay":"other//menu"} /-->',
				THEME
			)
		).toEqual( [ { type: 'part', id: 'other//menu' } ] );
	} );

	it( 'walks blocks from unsaved edits', () => {
		const blocks = [
			{
				name: 'core/group',
				innerBlocks: [
					{
						name: 'core/template-part',
						attributes: { slug: 'header' },
					},
				],
			},
		];

		expect( getReferences( blocks, THEME ) ).toEqual( [
			{ type: 'part', id: `${ THEME }//header` },
		] );
	} );

	it( 'skips delimiters with invalid attributes', () => {
		expect(
			getReferences( '<!-- wp:template-part {nope} /-->', THEME )
		).toEqual( [] );
	} );
} );

describe( 'needsPatterns', () => {
	it( 'is true when markup or blocks hold a Pattern block', () => {
		expect( needsPatterns( [ part( 'header' ) ] ) ).toBe( false );
		expect(
			needsPatterns( [ '<!-- wp:pattern {"slug":"a/b"} /-->' ] )
		).toBe( true );
		expect(
			needsPatterns( [
				[
					{
						name: 'core/group',
						innerBlocks: [ { name: 'core/pattern' } ],
					},
				],
			] )
		).toBe( true );
	} );
} );

describe( 'getSitePartsUsageFromRecords', () => {
	const id = ( slug: string ) => `${ THEME }//${ slug }`;

	const parts = [
		{ id: id( 'header' ), area: 'header', source: part( 'top-bar' ) },
		{ id: id( 'top-bar' ), area: 'uncategorized', source: '' },
		{ id: id( 'header-dark' ), area: 'header', source: '' },
		{
			id: id( 'header-nav' ),
			area: 'header',
			source: '<!-- wp:navigation {"overlay":"overlay"} /-->',
		},
		{ id: id( 'overlay' ), area: 'navigation-overlay', source: '' },
		{ id: id( 'overlay-unused' ), area: 'navigation-overlay', source: '' },
		{ id: id( 'footer' ), area: 'footer', source: '' },
		{ id: id( 'footer-small' ), area: 'footer', source: '' },
		{ id: id( 'unused-header' ), area: 'header', source: '' },
	];

	const templates = [
		{
			id: id( 'index' ),
			slug: 'index',
			source: part( 'header' ) + part( 'footer' ),
		},
		{
			id: id( 'page' ),
			slug: 'page',
			source: part( 'header' ) + part( 'footer-small' ),
		},
		{
			id: id( '404' ),
			slug: '404',
			source: part( 'header-dark' ) + part( 'footer' ),
		},
	];

	it( 'records the templates that use each part, through nesting', () => {
		const { parts: usage } = getSitePartsUsageFromRecords( {
			templates,
			parts,
			theme: THEME,
		} );

		expect( usage[ id( 'header' ) ].templates ).toEqual( [
			id( 'index' ),
			id( 'page' ),
		] );
		expect( usage[ id( 'top-bar' ) ] ).toEqual( {
			area: 'uncategorized',
			templates: [ id( 'index' ), id( 'page' ) ],
			parents: [ id( 'header' ) ],
		} );
		expect( usage[ id( 'unused-header' ) ].templates ).toEqual( [] );
	} );

	it( 'falls back to the index template without a homepage template', () => {
		const { primary } = getSitePartsUsageFromRecords( {
			templates,
			parts,
			theme: THEME,
		} );

		expect( primary.header ).toBe( id( 'header' ) );
		expect( primary.footer ).toBe( id( 'footer' ) );
	} );

	it( 'uses the homepage template first', () => {
		const { primary } = getSitePartsUsageFromRecords( {
			templates,
			parts,
			theme: THEME,
			homeTemplateId: id( 'page' ),
		} );

		expect( primary.footer ).toBe( id( 'footer-small' ) );
	} );

	it( 'falls back to index per area when the homepage lacks one', () => {
		const { primary } = getSitePartsUsageFromRecords( {
			templates: [
				...templates,
				{
					id: id( 'front-page' ),
					slug: 'front-page',
					source: part( 'footer-small' ),
				},
			],
			parts,
			theme: THEME,
			homeTemplateId: id( 'front-page' ),
		} );

		expect( primary.header ).toBe( id( 'header' ) );
		expect( primary.footer ).toBe( id( 'footer-small' ) );
	} );

	it( 'picks the first header and the last footer', () => {
		const { primary } = getSitePartsUsageFromRecords( {
			templates: [
				{
					id: id( 'index' ),
					slug: 'index',
					source:
						part( 'header-dark' ) +
						part( 'header' ) +
						part( 'footer' ) +
						part( 'footer-small' ),
				},
			],
			parts,
			theme: THEME,
		} );

		expect( primary.header ).toBe( id( 'header-dark' ) );
		expect( primary.footer ).toBe( id( 'footer-small' ) );
	} );

	it( 'finds the overlay through the primary header', () => {
		const { primary, parts: usage } = getSitePartsUsageFromRecords( {
			templates: [
				{
					id: id( 'index' ),
					slug: 'index',
					source: part( 'header-nav' ),
				},
			],
			parts,
			theme: THEME,
		} );

		expect( primary[ 'navigation-overlay' ] ).toBe( id( 'overlay' ) );
		expect( usage[ id( 'overlay' ) ] ).toEqual( {
			area: 'navigation-overlay',
			templates: [ id( 'index' ) ],
			parents: [ id( 'header-nav' ) ],
		} );
		expect( usage[ id( 'overlay-unused' ) ].templates ).toEqual( [] );
	} );

	it( 'has no primary for an area nothing uses', () => {
		const { primary } = getSitePartsUsageFromRecords( {
			templates,
			parts,
			theme: THEME,
		} );

		expect( primary[ 'navigation-overlay' ] ).toBeNull();
	} );

	it( 'resolves parts inside patterns', () => {
		const { primary, parts: usage } = getSitePartsUsageFromRecords( {
			templates: [
				{
					id: id( 'index' ),
					slug: 'index',
					source: '<!-- wp:pattern {"slug":"theme/header"} /-->',
				},
			],
			parts,
			patterns: [
				{ name: 'theme/header', content: part( 'header-dark' ) },
			],
			theme: THEME,
		} );

		expect( primary.header ).toBe( id( 'header-dark' ) );
		expect( usage[ id( 'header-dark' ) ].parents ).toEqual( [] );
	} );

	it( 'does not loop on a part that includes itself', () => {
		const { parts: usage } = getSitePartsUsageFromRecords( {
			templates: [
				{ id: id( 'index' ), slug: 'index', source: part( 'a' ) },
			],
			parts: [
				{ id: id( 'a' ), area: 'header', source: part( 'b' ) },
				{ id: id( 'b' ), area: 'header', source: part( 'a' ) },
			],
			theme: THEME,
		} );

		expect( usage[ id( 'a' ) ].templates ).toEqual( [ id( 'index' ) ] );
		expect( usage[ id( 'a' ) ].parents ).toEqual( [ id( 'b' ) ] );
		expect( usage[ id( 'b' ) ].parents ).toEqual( [ id( 'a' ) ] );
	} );

	it( 'ignores references to parts that do not exist', () => {
		const { parts: usage, primary } = getSitePartsUsageFromRecords( {
			templates: [
				{
					id: id( 'index' ),
					slug: 'index',
					source: part( 'deleted' ),
				},
			],
			parts: [ { id: id( 'header' ), area: 'header', source: '' } ],
			theme: THEME,
		} );

		expect( Object.keys( usage ) ).toEqual( [ id( 'header' ) ] );
		expect( primary.header ).toBeNull();
	} );
} );
