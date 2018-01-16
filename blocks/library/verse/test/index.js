/**
 * Internal dependencies
 */
import { registerVerseBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/verse', () => {
	beforeAll( () => {
		registerVerseBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/verse' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
