/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import MediaPlaceholder from '../';

describe( 'MediaPlaceholder', () => {
	it( 'renders successfully when allowedTypes property is not specified', () => {
		expect( () => mount(
			<MediaPlaceholder />
		) ).not.toThrow();
	} );
} );
