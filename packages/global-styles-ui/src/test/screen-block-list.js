import {
	hasUserStylesForBlock,
	getUserStylesSummary,
} from '../screen-block-list';

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

describe( 'getUserStylesSummary', () => {
	it( 'returns an empty string for a block with no entry', () => {
		expect( getUserStylesSummary( {}, 'core/quote' ) ).toBe( '' );
	} );

	it( 'names the categories changed under styles', () => {
		const user = {
			styles: {
				blocks: {
					'core/quote': {
						typography: { textTransform: 'uppercase' },
						color: { text: 'red' },
					},
				},
			},
		};
		expect( getUserStylesSummary( user, 'core/quote' ) ).toBe(
			'Colors, Typography'
		);
	} );

	it( 'names categories changed under settings', () => {
		const user = {
			settings: {
				blocks: {
					'core/quote': {
						color: { palette: [ { slug: 'a', color: '#fff' } ] },
					},
				},
			},
		};
		expect( getUserStylesSummary( user, 'core/quote' ) ).toBe( 'Color' );
	} );

	// A changed variation is named, not described: whatever was changed inside
	// it, it contributes one "{Label} variation" entry.
	it( 'names a changed variation using its registered label', () => {
		const user = {
			styles: {
				blocks: {
					'core/quote': {
						variations: {
							plain: { spacing: { padding: { top: '10px' } } },
						},
					},
				},
			},
		};
		expect(
			getUserStylesSummary( user, 'core/quote', [
				{ name: 'plain', label: 'Plain' },
			] )
		).toBe( 'Plain variation' );
	} );

	it( 'falls back to the slug when the variation is not registered', () => {
		const user = {
			styles: {
				blocks: {
					'core/quote': {
						variations: { fancy: { color: { text: 'red' } } },
					},
				},
			},
		};
		expect( getUserStylesSummary( user, 'core/quote', [] ) ).toBe(
			'fancy variation'
		);
	} );

	it( 'lists direct changes before the variation', () => {
		const user = {
			styles: {
				blocks: {
					'core/quote': {
						color: { text: 'red' },
						typography: { fontSize: '2rem' },
						variations: {
							plain: { color: { background: 'blue' } },
						},
					},
				},
			},
		};
		expect(
			getUserStylesSummary( user, 'core/quote', [
				{ name: 'plain', label: 'Plain' },
			] )
		).toBe( 'Colors, Typography, Plain variation' );
	} );

	it( 'ignores a variation whose values were all cleared', () => {
		const user = {
			styles: {
				blocks: {
					'core/quote': {
						color: { text: 'red' },
						variations: { plain: { color: { text: undefined } } },
					},
				},
			},
		};
		expect(
			getUserStylesSummary( user, 'core/quote', [
				{ name: 'plain', label: 'Plain' },
			] )
		).toBe( 'Colors' );
	} );

	it( 'names a border change', () => {
		const user = {
			styles: {
				blocks: { 'core/quote': { border: { width: '2px' } } },
			},
		};
		expect( getUserStylesSummary( user, 'core/quote' ) ).toBe( 'Border' );
	} );

	it( 'returns an empty string when no category can be named', () => {
		// Custom CSS is a real user change that the changelist does not report.
		const user = {
			styles: {
				blocks: { 'core/quote': { css: 'color: red;' } },
			},
		};
		expect( getUserStylesSummary( user, 'core/quote' ) ).toBe( '' );
	} );
} );
