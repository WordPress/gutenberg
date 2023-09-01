/**
 * Internal dependencies
 */
import reducer from '../reducer';

describe( 'performance', () => {
	const state = reducer( undefined, { type: '@@init' } );
	const blocks = [];
	for ( let i = 0; i < 100000; i++ ) {
		blocks.push( {
			clientId: `block-${ i }`,
			attributes: { content: `paragraph ${ i }` },
			innerBlocks: [],
		} );
	}

	let preparedState;

	it( 'should reset blocks', () => {
		preparedState = reducer( state, {
			type: 'RESET_BLOCKS',
			blocks,
		} );
		expect( preparedState ).toBeDefined();
	} );

	it( 'should update blocks', () => {
		const updatedState = reducer( preparedState, {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientIds: [ 'block-10' ],
			attributes: {
				content: 'updated paragraph 10',
			},
		} );

		expect( updatedState ).toBeDefined();
	} );

	it( 'should replace blocks (Enter in paragraphs)', () => {
		const updatedState = reducer( preparedState, {
			type: 'REPLACE_BLOCKS',
			clientIds: [ 'block-10' ],
			blocks: [
				{
					clientId: `block-10`,
					attributes: { content: `paragraph 10` },
					innerBlocks: [],
				},
				{
					clientId: `block-10-2`,
					attributes: { content: '' },
					innerBlocks: [],
				},
			],
			indexToSelect: 10,
			initialPosition: 0,
		} );

		expect( updatedState ).toBeDefined();
	} );

	it( 'should move blocks', () => {
		const updatedState = reducer( preparedState, {
			type: 'MOVE_BLOCKS_DOWN',
			clientIds: [ 'block-10' ],
			rootClientId: '',
		} );

		expect( updatedState ).toBeDefined();
	} );
} );
