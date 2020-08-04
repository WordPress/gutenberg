/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { MediaPlaceholder } from '../';

jest.mock( '../../media-upload/check', () => () => null );
jest.mock( '@wordpress/data/src/components/use-select', () => () => ( {} ) );

describe( 'MediaPlaceholder', () => {
	it( 'renders successfully when allowedTypes property is not specified', () => {
		expect( () => mount( <MediaPlaceholder /> ) ).not.toThrow();
	} );
} );
