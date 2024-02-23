/**
 * Internal dependencies
 */
import { getPageContentBlocks } from '../private-selectors';

describe( 'private selectors', () => {
	describe( 'getPageContentBlocks', () => {
		// |-0 template-part
		// | |- 00 site-title
		// | |- 01 navigation
		// |-1 group
		// | |-10 post-title
		// | |-11 post-featured-image
		// | |-12 post-content
		// | | |-120 paragraph
		// | | |-121 post-featured-image
		// |-2 query
		// | |-20 post-title
		// | |-21 post-featured-image
		// | |-22 post-content
		// |-3 template-part
		// | |-30 paragraph

		const testBlocks = {
			'': { order: [ '0', '1', '2' ] },
			0: {
				name: 'core/template-part',
				order: [ '00', '01' ],
			},
			'00': { name: 'core/site-title' },
			'01': { name: 'core/navigation' },
			1: {
				name: 'core/group',
				order: [ '10', '11', '12' ],
			},
			10: { name: 'core/post-title' },
			11: { name: 'core/post-featured-image' },
			12: {
				name: 'core/post-content',
				order: [ '120', '121' ],
			},
			120: { name: 'core/paragraph' },
			121: { name: 'core/post-featured-image' },
			2: {
				name: 'core/query',
				order: [ '20', '21', '22' ],
			},
			20: { name: 'core/post-title' },
			21: { name: 'core/post-featured-image' },
			22: { name: 'core/post-content' },
			3: {
				name: 'core/template-part',
				order: [ '30' ],
			},
			30: { name: 'core/paragraph' },
		};

		const getBlockOrder = jest.fn();
		const getBlockName = jest.fn();
		getPageContentBlocks.registry = {
			select: jest.fn( () => ( {
				getBlockOrder,
				getBlockName,
			} ) ),
		};

		it( 'returns an empty array if there are no blocks', () => {
			getBlockOrder.mockReturnValueOnce( [] );
			expect( getPageContentBlocks( {} ) ).toEqual( [] );
		} );

		it( 'returns page content blocks', () => {
			getBlockOrder.mockImplementation(
				( rootClientId ) => testBlocks[ rootClientId ]?.order ?? []
			);
			getBlockName.mockImplementation(
				( clientId ) => testBlocks[ clientId ]?.name
			);
			expect( getPageContentBlocks( {} ) ).toEqual( [
				'10', // post-title
				'11', // post-featured-image
				'12', // post-content
				// NOT the post-featured-image nested within post-content
				// NOT any of the content blocks within query
			] );
		} );
	} );
} );
