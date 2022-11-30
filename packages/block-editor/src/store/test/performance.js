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
	const preparedState = reducer( state, {
		type: 'RESET_BLOCKS',
		blocks,
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
} );
