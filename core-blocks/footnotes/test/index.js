/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { blockEditRender } from '../../test/helpers';
import '@wordpress/editor';

describe( 'core/footnotes', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( name, settings );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
