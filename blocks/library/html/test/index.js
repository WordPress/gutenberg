/**
 * Internal dependencies
 */
import { registerHtmlBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/html', () => {
	beforeAll( () => {
		registerHtmlBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/html' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
