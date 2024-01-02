/**
 * Internal dependencies
 */
import getGlobalStylesChanges from '../get-global-styles-changes';

jest.mock( '@wordpress/blocks', () => {
	return {
		...jest.requireActual( '@wordpress/blocks' ),
		getBlockTypes: jest.fn( () => [
			{
				name: 'core/paragraph',
				title: 'Test Paragraph',
			},
		] ),
	};
} );

describe( 'getGlobalStylesChanges', () => {
	const revision = {
		id: 10,
		styles: {
			typography: {
				fontSize: 'var(--wp--preset--font-size--potato)',
				fontStyle: 'normal',
				fontWeight: '600',
				lineHeight: '1.85',
				fontFamily: 'var(--wp--preset--font-family--asparagus)',
			},
			spacing: {
				padding: {
					top: '36px',
					right: '89px',
					bottom: '133px',
					left: 'var(--wp--preset--spacing--20)',
				},
				blockGap: '114px',
			},
			elements: {
				heading: {
					typography: {
						letterSpacing: '37px',
					},
				},
				caption: {
					color: {
						text: 'var(--wp--preset--color--pineapple)',
					},
				},
			},
			color: {
				text: 'var(--wp--preset--color--tomato)',
			},
			blocks: {
				'core/paragraph': {
					color: {
						text: '#000000',
					},
				},
			},
		},
		settings: {
			color: {
				palette: {
					theme: [
						{
							slug: 'one',
							color: 'pink',
						},
					],
				},
			},
		},
	};
	const previousRevision = {
		id: 9,
		styles: {
			typography: {
				fontSize: 'var(--wp--preset--font-size--fungus)',
				fontStyle: 'normal',
				fontWeight: '600',
				lineHeight: '1.85',
				fontFamily: 'var(--wp--preset--font-family--grapes)',
			},
			spacing: {
				padding: {
					top: '36px',
					right: '89px',
					bottom: '133px',
					left: 'var(--wp--preset--spacing--20)',
				},
				blockGap: '114px',
			},
			elements: {
				heading: {
					typography: {
						letterSpacing: '37px',
					},
				},
				caption: {
					typography: {
						fontSize: '1.11rem',
						fontStyle: 'normal',
						fontWeight: '600',
					},
				},
				link: {
					typography: {
						lineHeight: 2,
						textDecoration: 'line-through',
					},
					color: {
						text: 'var(--wp--preset--color--egg)',
					},
				},
			},
			color: {
				text: 'var(--wp--preset--color--tomato)',
				background: 'var(--wp--preset--color--pumpkin)',
			},
			blocks: {
				'core/paragraph': {
					color: {
						text: '#fff',
					},
				},
			},
		},
		settings: {
			color: {
				palette: {
					theme: [
						{
							slug: 'one',
							color: 'blue',
						},
					],
				},
			},
		},
	};

	it( 'returns a list of changes and caches them', () => {
		const resultA = getGlobalStylesChanges( revision, previousRevision );
		expect( resultA ).toEqual( [
			'Colors',
			'Typography',
			'Test Paragraph block',
			'Caption element',
			'Link element',
			'Color settings',
		] );

		const resultB = getGlobalStylesChanges( revision, previousRevision );

		expect( resultA ).toBe( resultB );
	} );

	it( 'returns a list of truncated changes', () => {
		const resultA = getGlobalStylesChanges( revision, previousRevision, {
			maxResults: 3,
		} );
		expect( resultA ).toEqual( [
			'Colors',
			'Typography',
			'Test Paragraph block',
			'…and 3 more changes.',
		] );
	} );

	it( 'skips unknown and unchanged keys', () => {
		const result = getGlobalStylesChanges(
			{
				styles: {
					frogs: {
						legs: 'green',
					},
					typography: {
						fontSize: '1rem',
					},
					settings: {
						'': {
							'': 'foo',
						},
					},
				},
			},
			{
				styles: {
					frogs: {
						legs: 'yellow',
					},
					typography: {
						fontSize: '1rem',
					},
					settings: {
						'': {
							'': 'bar',
						},
					},
				},
			}
		);
		expect( result ).toEqual( [] );
	} );
} );
