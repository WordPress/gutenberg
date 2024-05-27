/**
 * Internal dependencies
 */
import getGlobalStylesChanges, {
	getGlobalStylesChangelist,
} from '../get-global-styles-changes';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';

describe( 'getGlobalStylesChanges and utils', () => {
	const next = {
		styles: {
			background: {
				backgroundImage: {
					url: 'https://example.com/image.jpg',
				},
				backgroundSize: 'contain',
				backgroundPosition: '30% 30%',
				backgroundRepeat: 'no-repeat',
			},
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
				h3: {
					typography: {
						lineHeight: '1.2',
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
				'core/test-fiori-di-zucca': {
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
				gradients: [
					{
						name: 'Something something',
						gradient:
							'linear-gradient(105deg,rgba(6,147,100,1) 0%,rgb(155,81,100) 100%)',
						slug: 'something-something',
					},
				],
			},
		},
	};
	const previous = {
		styles: {
			background: {
				backgroundImage: {
					url: 'https://example.com/image_new.jpg',
				},
				backgroundSize: 'contain',
				backgroundPosition: '40% 77%',
				backgroundRepeat: 'repeat',
			},
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
				h3: {
					typography: {
						lineHeight: '2',
					},
				},
				h6: {
					typography: {
						lineHeight: '1.2',
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
				'core/test-fiori-di-zucca': {
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
					custom: [
						{
							slug: 'one',
							color: 'tomato',
						},
					],
				},
				gradients: [
					{
						name: 'Vivid cyan blue to vivid purple',
						gradient:
							'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
						slug: 'vivid-cyan-blue-to-vivid-purple',
					},
				],
			},
			typography: {
				fluid: true,
			},
		},
	};

	beforeEach( () => {
		registerBlockType( 'core/test-fiori-di-zucca', {
			save: () => {},
			category: 'text',
			title: 'Test pumpkin flowers',
			edit: () => {},
		} );
	} );

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'getGlobalStylesChanges()', () => {
		it( 'returns a list of changes', () => {
			const result = getGlobalStylesChanges( next, previous );
			expect( result ).toEqual( [
				'Background, Colors, Typography styles.',
				'Test pumpkin flowers block.',
				'H3, Caption, H6, Link elements.',
				'Color, Typography settings.',
			] );
		} );

		it( 'returns a list of truncated changes', () => {
			const resultA = getGlobalStylesChanges( next, previous, {
				maxResults: 4,
			} );
			expect( resultA ).toEqual( [
				'Background, Colors, Typography styles.',
				'Test pumpkin flowers block.',
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

	describe( 'getGlobalStylesChangelist()', () => {
		it( 'compares two objects and returns a cached list of changed keys', () => {
			const resultA = getGlobalStylesChangelist( next, previous );

			expect( resultA ).toEqual( [
				[ 'styles', 'Background' ],
				[ 'styles', 'Colors' ],
				[ 'styles', 'Typography' ],
				[ 'blocks', 'Test pumpkin flowers' ],
				[ 'elements', 'H3' ],
				[ 'elements', 'Caption' ],
				[ 'elements', 'H6' ],
				[ 'elements', 'Link' ],
				[ 'settings', 'Color' ],
				[ 'settings', 'Typography' ],
			] );

			const resultB = getGlobalStylesChangelist( next, previous );

			expect( resultB ).toEqual( resultA );
		} );
	} );
} );
