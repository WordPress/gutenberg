/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PlaylistTrackEdit from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	BlockControls: ( { children } ) => <div>{ children }</div>,
	BlockIcon: () => <span />,
	InspectorControls: ( { children } ) => <div>{ children }</div>,
	MediaPlaceholder: () => <div />,
	MediaReplaceFlow: () => <div />,
	MediaUpload: ( { render: renderMediaUpload } ) =>
		renderMediaUpload( { open: jest.fn() } ),
	MediaUploadCheck: ( { children } ) => <div>{ children }</div>,
	RichText: ( {
		allowedFormats,
		onChange,
		placeholder,
		tagName: TagName = 'div',
		value,
		withoutInteractiveFormatting,
		...props
	} ) => <TagName { ...props }>{ value || placeholder }</TagName>,
	store: 'core/block-editor',
	useBlockProps: jest.fn( () => ( {} ) ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
	combineReducers: jest.fn( ( reducers ) => ( state = {}, action ) => {
		const newState = {};
		Object.keys( reducers ).forEach( ( key ) => {
			newState[ key ] = reducers[ key ]( state[ key ], action );
		} );
		return newState;
	} ),
	createRegistrySelector: jest.fn( ( fn ) => fn ),
	createReduxStore: jest.fn( () => ( {} ) ),
	createSelector: jest.fn( ( fn ) => fn ),
	register: jest.fn(),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

jest.mock( '../../utils/hooks', () => ( {
	useUploadMediaFromBlobURL: jest.fn(),
} ) );

const defaultAttributes = {
	id: 1,
	src: 'https://example.com/song.mp3',
	album: 'Great Album',
	artist: 'The Artist',
	image: 'https://example.com/cover.jpg',
	imageAlt: 'A bright abstract album cover',
	length: '3:45',
	title: 'Song One',
};

const updateBlockAttributes = jest.fn();

function renderEdit( props = {} ) {
	const setAttributes = jest.fn();

	render(
		<PlaylistTrackEdit
			attributes={ {
				...defaultAttributes,
				...props.attributes,
			} }
			setAttributes={ setAttributes }
			context={ {
				showArtists: true,
				showImages: true,
				...props.context,
			} }
			clientId="playlist-track-client-id"
			isSelected={ props.isSelected ?? false }
		/>
	);

	return { setAttributes };
}

describe( 'PlaylistTrackEdit', () => {
	beforeEach( () => {
		updateBlockAttributes.mockClear();
		useDispatch.mockImplementation( ( store ) =>
			store === 'core/block-editor'
				? { updateBlockAttributes }
				: { createErrorNotice: jest.fn() }
		);
		useSelect.mockReturnValue( [] );
	} );

	it( 'allows the album cover alternative text to be edited', () => {
		const { setAttributes } = renderEdit();

		expect(
			screen.getByRole( 'link', {
				name: /Describe the purpose of the image\./,
			} )
		).toHaveAttribute(
			'href',
			'https://www.w3.org/WAI/tutorials/images/decision-tree/'
		);
		expect(
			screen.queryByText( 'Leave empty if decorative.' )
		).not.toBeInTheDocument();

		fireEvent.change( screen.getByLabelText( 'Alternative text' ), {
			target: { value: 'A silver microphone on a red background' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			imageAlt: 'A silver microphone on a red background',
		} );
	} );

	it( 'does not show the alternative text control without an album cover image', () => {
		renderEdit( {
			attributes: {
				image: undefined,
				imageAlt: undefined,
			},
		} );

		expect(
			screen.queryByLabelText( 'Alternative text' )
		).not.toBeInTheDocument();
	} );

	it( 'syncs selected track spacing and dimensions to sibling tracks', async () => {
		const sharedStyle = {
			spacing: {
				padding: {
					top: '1rem',
					bottom: '1rem',
				},
				margin: {
					top: '0.5rem',
				},
			},
			dimensions: {
				minHeight: '80px',
			},
		};

		useSelect.mockReturnValue( [
			{
				clientId: 'playlist-track-client-id',
				style: sharedStyle,
			},
			{
				clientId: 'sibling-track-client-id',
				style: {
					spacing: {
						padding: {
							top: '0.25rem',
						},
					},
				},
			},
		] );

		renderEdit( {
			attributes: {
				style: sharedStyle,
			},
			isSelected: true,
		} );

		await waitFor( () =>
			expect( updateBlockAttributes ).toHaveBeenCalledWith(
				'sibling-track-client-id',
				{
					style: sharedStyle,
				}
			)
		);
	} );
} );
