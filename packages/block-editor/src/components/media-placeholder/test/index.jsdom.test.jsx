import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MediaPlaceholder } from '../';

vi.mock( import( '../../media-upload/check' ), () => ( {
	default: () => null,
} ) );
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: () => ( {} ),
} ) );

describe( 'MediaPlaceholder', () => {
	it( 'renders successfully when allowedTypes property is not specified', () => {
		expect( () => render( <MediaPlaceholder multiple /> ) ).not.toThrow();
	} );
} );
