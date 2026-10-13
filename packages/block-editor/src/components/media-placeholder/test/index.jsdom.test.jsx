import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MediaPlaceholder } from '../';

const { mediaUpload } = vi.hoisted( () => ( { mediaUpload: vi.fn() } ) );

vi.mock( import( '../../media-upload/check' ), () => ( {
	default: ( { children } ) => children,
} ) );
vi.mock( import( '@wordpress/components' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	Placeholder: ( { children } ) => <div>{ children }</div>,
} ) );
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: () => ( { mediaUpload } ),
} ) );

describe( 'MediaPlaceholder', () => {
	afterEach( () => mediaUpload.mockClear() );

	it( 'renders successfully when allowedTypes property is not specified', () => {
		expect( () => render( <MediaPlaceholder multiple /> ) ).not.toThrow();
	} );

	it( 'opts into batch updates for multiple files and keeps the legacy fallback', () => {
		const onSelect = vi.fn();
		render( <MediaPlaceholder multiple onSelect={ onSelect } /> );
		fireEvent.change( screen.getByTestId( 'form-file-upload-input' ), {
			target: {
				files: [
					new File( [ 'a' ], 'a.png', { type: 'image/png' } ),
					new File( [ 'b' ], 'b.png', { type: 'image/png' } ),
				],
			},
		} );

		const { onFileChange, onFilesChange } =
			mediaUpload.mock.calls[ 0 ][ 0 ];
		const attachments = [
			{ id: 1, url: 'a.png' },
			{ id: 2, url: 'b.png' },
		];
		onFilesChange( attachments );
		expect( onSelect ).toHaveBeenLastCalledWith( attachments );
		onFileChange( attachments );
		expect( onSelect ).toHaveBeenLastCalledWith( attachments );
	} );
} );
