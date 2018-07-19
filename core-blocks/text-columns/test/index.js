/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { blockEditRender } from '../../test/helpers';

describe( 'core/text-columns', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( name, settings );

		expect( wrapper ).toMatchSnapshot();
		expect( console ).toHaveWarnedWith(
			'The Text Columns block is deprecated and will be removed. Please use the Columns block instead.'
		);
	} );
} );
