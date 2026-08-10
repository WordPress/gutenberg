import { hasUserStylesForBlock } from '../screen-block-list';

describe( 'hasUserStylesForBlock', () => {
	it( 'returns false when there is no user config', () => {
		expect( hasUserStylesForBlock( undefined, 'core/quote' ) ).toBe(
			false
		);
		expect( hasUserStylesForBlock( {}, 'core/quote' ) ).toBe( false );
	} );

	it( 'returns false for a block with no entry', () => {
		const user = {
			styles: {
				blocks: { 'core/paragraph': { color: { text: 'red' } } },
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( false );
	} );

	it( 'returns true for a styles entry', () => {
		const user = {
			styles: { blocks: { 'core/quote': { color: { text: 'red' } } } },
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( true );
	} );

	it( 'returns true for a settings-only entry', () => {
		const user = {
			settings: {
				blocks: {
					'core/quote': {
						color: { palette: [ { slug: 'a', color: '#fff' } ] },
					},
				},
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( true );
	} );

	it( 'returns true for a block style variation entry', () => {
		const user = {
			styles: {
				blocks: {
					'core/quote': {
						variations: { plain: { color: { text: 'red' } } },
					},
				},
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( true );
	} );

	// Clearing a value writes `undefined` in place rather than removing the
	// key, so a husk like this means "not customized".
	it( 'returns false for an entry whose values were all cleared', () => {
		const user = {
			styles: {
				blocks: {
					'core/quote': {
						color: { text: undefined, background: undefined },
						typography: {},
					},
				},
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( false );
	} );

	it( 'returns false for an empty array but true for a populated one', () => {
		const emptyPalette = {
			settings: { blocks: { 'core/quote': { color: { palette: [] } } } },
		};
		expect( hasUserStylesForBlock( emptyPalette, 'core/quote' ) ).toBe(
			false
		);

		const fullPalette = {
			settings: {
				blocks: {
					'core/quote': {
						color: { palette: [ { slug: 'a', color: '#fff' } ] },
					},
				},
			},
		};
		expect( hasUserStylesForBlock( fullPalette, 'core/quote' ) ).toBe(
			true
		);
	} );

	it( 'treats an empty string and zero as real values', () => {
		const emptyString = {
			styles: { blocks: { 'core/quote': { css: '' } } },
		};
		expect( hasUserStylesForBlock( emptyString, 'core/quote' ) ).toBe(
			true
		);

		const zero = {
			styles: { blocks: { 'core/quote': { spacing: { padding: 0 } } } },
		};
		expect( hasUserStylesForBlock( zero, 'core/quote' ) ).toBe( true );
	} );

	it( 'returns true when only one of the two roots has a real value', () => {
		const user = {
			styles: {
				blocks: { 'core/quote': { color: { text: undefined } } },
			},
			settings: {
				blocks: {
					'core/quote': { typography: { customFontSize: true } },
				},
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( true );
	} );
} );

describe( 'filter composition', () => {
	const blocks = [
		{ name: 'core/paragraph', title: 'Paragraph' },
		{ name: 'core/quote', title: 'Quote' },
		{ name: 'core/image', title: 'Image' },
	];
	const user = {
		styles: {
			blocks: {
				'core/quote': { color: { text: 'red' } },
				'core/image': { spacing: { padding: '10px' } },
			},
		},
	};

	// Mirrors the two filters applied in BlockList: search first, then the
	// customized filter.
	const visible = ( searchTerm, styleFilter ) => {
		const customized = new Set(
			blocks
				.map( ( { name } ) => name )
				.filter( ( name ) => hasUserStylesForBlock( user, name ) )
		);
		return blocks
			.filter( ( block ) =>
				block.title.toLowerCase().includes( searchTerm.toLowerCase() )
			)
			.filter(
				( block ) =>
					styleFilter !== 'customized' || customized.has( block.name )
			)
			.map( ( block ) => block.name );
	};

	it( 'shows everything when neither filter is active', () => {
		expect( visible( '', 'all' ) ).toEqual( [
			'core/paragraph',
			'core/quote',
			'core/image',
		] );
	} );

	it( 'shows only customized blocks when the filter is on', () => {
		expect( visible( '', 'customized' ) ).toEqual( [
			'core/quote',
			'core/image',
		] );
	} );

	it( 'applies search and the customized filter together', () => {
		// "Paragraph" matches the search but is not customized.
		expect( visible( 'p', 'all' ) ).toEqual( [ 'core/paragraph' ] );
		expect( visible( 'p', 'customized' ) ).toEqual( [] );
		// "Image" matches and is customized.
		expect( visible( 'ima', 'customized' ) ).toEqual( [ 'core/image' ] );
	} );
} );
