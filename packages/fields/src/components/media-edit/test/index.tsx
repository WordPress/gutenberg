/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MediaEdit from '..';

jest.mock( '@wordpress/core-data', () => ( {
	store: { name: 'core' },
} ) );

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/media-utils', () => ( {
	MediaUpload: ( { render: renderMediaUpload } ) =>
		renderMediaUpload( { open: jest.fn() } ),
	privateApis: {},
	uploadMedia: jest.fn(),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: { name: 'notices' },
} ) );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: () => ( { MediaUploadModal: () => null } ),
} ) );

const attachment = {
	id: 7,
	title: { rendered: 'Logo &amp; Mark' },
	source_url: 'https://example.com/logo.png',
	mime_type: 'image/png',
	alt_text: '',
};

const field = {
	id: 'site_logo',
	type: 'media',
	label: 'Site Logo',
	getValue: () => 7,
	setValue: ( { value } ) => ( { site_logo: value } ),
};

function renderMediaEdit( isExpanded = false ) {
	return render(
		<MediaEdit
			data={ { site_logo: 7 } }
			field={ field }
			onChange={ jest.fn() }
			isExpanded={ isExpanded }
		/>
	);
}

describe( 'MediaEdit', () => {
	beforeEach( () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getEntityRecords: () => [ attachment ],
			} ) )
		);
		useDispatch.mockReturnValue( {
			createErrorNotice: jest.fn(),
			receiveEntityRecords: jest.fn(),
		} );
	} );

	it( 'displays a decoded attachment title', () => {
		renderMediaEdit();

		expect( screen.getByText( 'Logo & Mark' ) ).toBeVisible();
	} );

	it( 'uses the decoded attachment title in the replacement label', () => {
		renderMediaEdit( true );

		expect(
			screen.getByRole( 'button', { name: 'Replace Logo & Mark' } )
		).toBeVisible();
	} );
} );
