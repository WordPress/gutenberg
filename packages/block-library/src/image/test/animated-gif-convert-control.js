/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import AnimatedGifConvertControl from '../animated-gif-convert-control';

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
	BlockControls: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	/*
	 * Passthroughs needed because @wordpress/components transitively pulls in
	 * the rich-text store, which registers via these helpers at import time.
	 */
	combineReducers: jest.fn( ( reducers ) => ( state = {}, action ) => {
		const newState = {};
		Object.keys( reducers ).forEach( ( key ) => {
			newState[ key ] = reducers[ key ]( state[ key ], action );
		} );
		return newState;
	} ),
	createSelector: jest.fn( ( fn ) => fn ),
	createRegistrySelector: jest.fn( ( fn ) => fn ),
	createReduxStore: jest.fn( () => ( {} ) ),
	register: jest.fn(),
} ) );

/*
 * core/video is not registered in this unit test, so stub createBlock with a
 * lightweight factory that preserves the name and attributes for assertion.
 */
jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( name, attributes ) => ( {
		name,
		attributes,
		clientId: 'new-video-block',
	} ) ),
} ) );

/**
 * Builds a `select` function that returns the given store mocks and records
 * whether the attachment record was requested.
 *
 * @param {Object}   options                 Options.
 * @param {string}   [options.rootBlockName] Block name of the block's root (e.g. 'core/gallery').
 * @param {Function} options.getEntityRecord Spy used for getEntityRecord.
 * @return {Function} A select() implementation.
 */
function makeSelect( { rootBlockName = undefined, getEntityRecord } ) {
	return ( storeName ) => {
		if ( storeName === 'core/block-editor' ) {
			return {
				getBlockRootClientId: () =>
					rootBlockName ? 'root-client-id' : undefined,
				getBlockName: () => rootBlockName,
			};
		}
		// core-data store.
		return {
			getEntityRecord: ( ...args ) => getEntityRecord( ...args ),
		};
	};
}

describe( 'AnimatedGifConvertControl', () => {
	let replaceBlocks;
	let getEntityRecord;

	const companionRecord = {
		source_url: 'https://example.com/wp-content/uploads/cat.gif',
		media_details: {
			animated_video: 'cat.mp4',
			animated_video_poster: 'cat.jpg',
			width: 320,
			height: 240,
		},
	};

	beforeEach( () => {
		jest.clearAllMocks();
		replaceBlocks = jest.fn();
		getEntityRecord = jest.fn( () => companionRecord );
		useDispatch.mockReturnValue( { replaceBlocks } );
	} );

	/*
	 * Renders the control, running the real selector against a controlled
	 * `select` so the gating logic (and any attachment fetch) is exercised.
	 */
	function renderControl( { attributes, select } ) {
		useSelect.mockImplementation( ( mapSelect ) => mapSelect( select ) );
		return render(
			<AnimatedGifConvertControl
				attributes={ attributes }
				clientId="block-1"
			/>
		);
	}

	it( 'renders the "Display as video" button when a video companion exists', () => {
		renderControl( {
			attributes: {
				id: 7,
				url: 'https://example.com/wp-content/uploads/cat.gif',
			},
			select: makeSelect( { getEntityRecord } ),
		} );

		expect(
			screen.getByRole( 'button', { name: 'Display as video' } )
		).toBeVisible();
		expect( getEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			7,
			{ context: 'view' }
		);
	} );

	it( 'still recognizes a GIF URL that carries a query string', () => {
		renderControl( {
			attributes: {
				id: 7,
				url: 'https://example.com/wp-content/uploads/cat.gif?ver=2',
			},
			select: makeSelect( { getEntityRecord } ),
		} );

		expect( getEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			7,
			{ context: 'view' }
		);
		expect(
			screen.getByRole( 'button', { name: 'Display as video' } )
		).toBeVisible();
	} );

	it( 'does not fetch the attachment for a non-GIF image', () => {
		const { container } = renderControl( {
			attributes: {
				id: 7,
				url: 'https://example.com/wp-content/uploads/cat.jpg',
			},
			select: makeSelect( { getEntityRecord } ),
		} );

		expect( getEntityRecord ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not fetch the attachment when the block has no id', () => {
		const { container } = renderControl( {
			attributes: {
				url: 'https://example.com/wp-content/uploads/cat.gif',
			},
			select: makeSelect( { getEntityRecord } ),
		} );

		expect( getEntityRecord ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'hides the control inside a gallery without fetching', () => {
		const { container } = renderControl( {
			attributes: {
				id: 7,
				url: 'https://example.com/wp-content/uploads/cat.gif',
			},
			select: makeSelect( {
				rootBlockName: 'core/gallery',
				getEntityRecord,
			} ),
		} );

		expect( getEntityRecord ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when the attachment has no animated_video companion', () => {
		const { container } = renderControl( {
			attributes: {
				id: 7,
				url: 'https://example.com/wp-content/uploads/cat.gif',
			},
			select: makeSelect( {
				getEntityRecord: jest.fn( () => ( {
					source_url: 'https://example.com/x/cat.gif',
					media_details: {},
				} ) ),
			} ),
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'replaces the image with a GIF-style video block built from the companion', async () => {
		const user = userEvent.setup();
		renderControl( {
			attributes: {
				id: 7,
				url: 'https://example.com/wp-content/uploads/cat.gif',
				caption: 'A cat',
			},
			select: makeSelect( { getEntityRecord } ),
		} );

		await user.click(
			screen.getByRole( 'button', { name: 'Display as video' } )
		);

		expect( replaceBlocks ).toHaveBeenCalledTimes( 1 );
		const [ replacedClientId, newBlock ] = replaceBlocks.mock.calls[ 0 ];
		expect( replacedClientId ).toBe( 'block-1' );
		expect( newBlock.name ).toBe( 'core/video' );
		expect( newBlock.attributes ).toMatchObject( {
			id: 7,
			src: 'https://example.com/wp-content/uploads/cat.mp4',
			poster: 'https://example.com/wp-content/uploads/cat.jpg',
			caption: 'A cat',
			controls: false,
			loop: true,
			autoplay: true,
			muted: true,
			playsInline: true,
			width: 320,
			height: 240,
		} );
	} );

	it( 'carries align, anchor, className and margin onto the video block', async () => {
		const user = userEvent.setup();
		renderControl( {
			attributes: {
				id: 7,
				url: 'https://example.com/wp-content/uploads/cat.gif',
				align: 'wide',
				anchor: 'cat-gif',
				className: 'is-style-rounded',
				style: { spacing: { margin: { top: '20px' } } },
			},
			select: makeSelect( { getEntityRecord } ),
		} );

		await user.click(
			screen.getByRole( 'button', { name: 'Display as video' } )
		);

		const [ , newBlock ] = replaceBlocks.mock.calls[ 0 ];
		expect( newBlock.attributes ).toMatchObject( {
			align: 'wide',
			anchor: 'cat-gif',
			className: 'is-style-rounded',
			style: { spacing: { margin: { top: '20px' } } },
		} );
	} );
} );
