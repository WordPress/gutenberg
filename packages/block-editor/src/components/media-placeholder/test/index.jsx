import { render } from '@testing-library/react';
import { MediaPlaceholder } from '../';

jest.mock( '../../media-upload/check', () => () => null );
jest.mock( '@wordpress/data/src/components/use-select', () => () => ( {} ) );

describe( 'MediaPlaceholder', () => {
	it( 'renders successfully when allowedTypes property is not specified', () => {
		expect( () => render( <MediaPlaceholder multiple /> ) ).not.toThrow();
	} );
} );
