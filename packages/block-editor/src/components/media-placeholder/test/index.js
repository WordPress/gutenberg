/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { MediaPlaceholder } from '../';

jest.mock( '../../media-upload/check', () => () => null );

describe( 'MediaPlaceholder', () => {
	it( 'renders successfully when allowedTypes property is not specified', () => {
		expect( () =>
			mount( <MediaPlaceholder hasUploadPermissions={ false } /> )
		).not.toThrow();
	} );
} );
