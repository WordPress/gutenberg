/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { blockEditRender } from '../../test/helpers';

describe( 'core/cover-image', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( name, settings );

		expect( wrapper ).toMatchSnapshot();
		expect( console ).toHaveWarnedWith(
			'The Cover Image block is deprecated and will be removed. Please use the Cover block instead.'
		);
	} );
} );
