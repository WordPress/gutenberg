/**
 * Internal dependencies
 */
import { registerParagraphBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/paragraph', () => {
	beforeAll( () => {
		registerParagraphBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/paragraph' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
