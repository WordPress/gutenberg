/**
 * Internal dependencies
 */
import getRevisionChanges from '../get-revision-changes';

describe( 'getRevisionChanges', () => {
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
	const blockNames = {
		'core/paragraph': 'Paragraph',
	};
	it( 'returns a list of changes and caches them', () => {
		const resultA = getRevisionChanges(
			revision,
			previousRevision,
			blockNames
		);
		expect( resultA ).toEqual( [
			'Colors',
			'Typography',
			'Paragraph block',
			'Caption element',
			'Link element',
			'Color settings',
		] );

		const resultB = getRevisionChanges(
			revision,
			previousRevision,
			blockNames
		);

		expect( resultA ).toBe( resultB );
	} );

	it( 'skips unknown and unchanged keys', () => {
		const result = getRevisionChanges(
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
