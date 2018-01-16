/**
 * Internal dependencies
 */
import { registerQuoteBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/quote', () => {
	beforeAll( () => {
		registerQuoteBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/quote' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
