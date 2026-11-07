import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import FilteredMediaPlaceholder, { MediaPlaceholder } from '../';

vi.mock( import( '../../media-upload/check' ), () => ( {
	default: () => null,
} ) );
// @ts-expect-error The `useSelect` mock returns no settings.
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: () => ( {} ),
} ) );

describe( 'MediaPlaceholder', () => {
	it( 'renders successfully when allowedTypes property is not specified', () => {
		expect( () =>
			// @ts-expect-error The test renders without a selection handler.
			render( <MediaPlaceholder multiple /> )
		).not.toThrow();
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
