import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FilteredMediaPlaceholder, { MediaPlaceholder } from '../';

const { mediaUpload } = vi.hoisted( () => ( { mediaUpload: vi.fn() } ) );

vi.mock( import( '../../media-upload/check' ), () => ( {
	default: ( { children } ) => children,
} ) );
vi.mock( import( '@wordpress/components' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	Placeholder: ( { children } ) => <div>{ children }</div>,
} ) );
// @ts-expect-error The `useSelect` mock returns only the upload setting.
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: () => ( { mediaUpload } ),
} ) );

describe( 'MediaPlaceholder', () => {
	afterEach( () => mediaUpload.mockClear() );

	it( 'renders successfully when allowedTypes property is not specified', () => {
		expect( () =>
			// @ts-expect-error The test renders without a selection handler.
			render( <MediaPlaceholder multiple /> )
		).not.toThrow();
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

/*
 * These checks run at type-check time: each `@ts-expect-error` fails the
 * type check if the line below it stops being a type error.
 */
describe( 'MediaPlaceholder types', () => {
	interface Image {
		id: number;
		url: string;
	}

	it( 'accepts media declared with interfaces', () => {
		const image: Image = { id: 1, url: 'https://example.com/a.png' };
		const onSelect: ( media: Image | Image[] ) => void = () => {};

		const single = (
			<FilteredMediaPlaceholder value={ image } onSelect={ onSelect } />
		);
		const gallery = (
			<FilteredMediaPlaceholder
				value={ [ image ] }
				onSelect={ onSelect }
				multiple
			/>
		);

		expect( [ single, gallery ] ).toHaveLength( 2 );
	} );

	it( 'accepts inline media with metadata', () => {
		const onSelect: ( media: unknown ) => void = () => {};

		const single = (
			<FilteredMediaPlaceholder
				value={ { id: 1, url: 'a.png', alt: 'Description' } }
				onSelect={ onSelect }
			/>
		);
		const gallery = (
			<FilteredMediaPlaceholder
				value={ [ { id: 1, url: 'a.png', alt: 'Description' } ] }
				onSelect={ onSelect }
				multiple
			/>
		);

		expect( [ single, gallery ] ).toHaveLength( 2 );
	} );

	it( 'passes the files to onSelect when they are not uploaded', () => {
		const onSelectImage: ( media: Image ) => void = () => {};
		const onSelectImageOrFiles: (
			media: Image | ArrayLike< File >
		) => void = () => {};

		const withFiles = (
			<FilteredMediaPlaceholder
				handleUpload={ false }
				onSelect={ onSelectImageOrFiles }
			/>
		);
		const withoutFiles = (
			// @ts-expect-error The files reach `onSelect` without an upload.
			<FilteredMediaPlaceholder
				handleUpload={ false }
				onSelect={ onSelectImage }
			/>
		);

		expect( [ withFiles, withoutFiles ] ).toHaveLength( 2 );
	} );
} );
