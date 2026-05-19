/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * The block-editor settings dispatcher and the `core/media-editor` close
 * action are mocked so the shim's open/close lifecycle is testable in
 * isolation — without bringing up the real modal UI.
 */
const mockClose = jest.fn();
const mockOpen = jest.fn();
let mockSettings: Record< symbol | string, unknown > = {};

jest.mock( '@wordpress/block-editor', () => {
	const { __dangerousOptInToUnstableAPIsOnlyForCoreModules } =
		jest.requireActual( '@wordpress/private-apis' );
	const { lock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/block-editor'
	);
	const openMediaUploadModalKey = Symbol( 'openMediaUploadModal' );
	const privateApis = {};
	lock( privateApis, { openMediaUploadModalKey } );
	return {
		privateApis,
		store: {
			name: 'core/block-editor',
		},
		__esModule: true,
		// Expose the symbol on the module so tests can plant it on settings.

		__openMediaUploadModalKey: openMediaUploadModalKey,
	};
} );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( fn: ( select: ( store: unknown ) => unknown ) => unknown ) => {
		return fn( () => ( {
			getSettings: () => mockSettings,
		} ) );
	},
	dispatch: ( storeName: string ) => {
		if ( storeName === 'core/media-editor' ) {
			return { closeMediaUploadModal: mockClose };
		}
		return undefined;
	},
} ) );

// Import after mocks so the shim picks up the mocked block-editor private API.

const { __openMediaUploadModalKey } = require( '@wordpress/block-editor' ) as {
	__openMediaUploadModalKey: symbol;
};

import { MediaUploadModal } from '../index';

const sessionA = Symbol( 'session-A' );

beforeEach( () => {
	mockClose.mockClear();
	mockOpen.mockClear();
	mockOpen.mockReturnValue( sessionA );
	mockSettings = {
		[ __openMediaUploadModalKey ]: mockOpen,
	};
} );

describe( 'MediaUploadModal (shim)', () => {
	it( 'renders nothing in the DOM', () => {
		const { container } = render(
			<MediaUploadModal isOpen={ false } onSelect={ jest.fn() } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'dispatches open when isOpen transitions false → true', () => {
		const onSelect = jest.fn();
		const onClose = jest.fn();
		const { rerender } = render(
			<MediaUploadModal
				isOpen={ false }
				onSelect={ onSelect }
				onClose={ onClose }
			/>
		);
		expect( mockOpen ).not.toHaveBeenCalled();

		rerender(
			<MediaUploadModal
				isOpen
				onSelect={ onSelect }
				onClose={ onClose }
				multiple
				allowedTypes={ [ 'image' ] }
				title="Pick"
			/>
		);

		expect( mockOpen ).toHaveBeenCalledTimes( 1 );
		const callArg = mockOpen.mock.calls[ 0 ][ 0 ];
		expect( callArg.multiple ).toBe( true );
		expect( callArg.allowedTypes ).toEqual( [ 'image' ] );
		expect( callArg.title ).toBe( 'Pick' );
		expect( typeof callArg.onSelect ).toBe( 'function' );
		expect( typeof callArg.onClose ).toBe( 'function' );
	} );

	it( 'dispatches open on initial mount when isOpen=true', () => {
		render( <MediaUploadModal isOpen onSelect={ jest.fn() } /> );
		expect( mockOpen ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'forwards the latest onSelect via ref (no churn on prop change)', () => {
		const firstOnSelect = jest.fn();
		const secondOnSelect = jest.fn();
		const { rerender } = render(
			<MediaUploadModal isOpen onSelect={ firstOnSelect } />
		);
		expect( mockOpen ).toHaveBeenCalledTimes( 1 );

		// Change the onSelect prop; the shim should NOT re-open.
		rerender( <MediaUploadModal isOpen onSelect={ secondOnSelect } /> );
		expect( mockOpen ).toHaveBeenCalledTimes( 1 );

		// Now invoke the captured onSelect — it should call the LATEST prop.
		const capturedOnSelect = mockOpen.mock.calls[ 0 ][ 0 ].onSelect;
		const media = { id: 1, url: 'x.png' };
		capturedOnSelect( media );
		expect( secondOnSelect ).toHaveBeenCalledWith( media );
		expect( firstOnSelect ).not.toHaveBeenCalled();
	} );

	it( 'dispatches close with its session when isOpen flips back to false', () => {
		const { rerender } = render(
			<MediaUploadModal isOpen onSelect={ jest.fn() } />
		);
		expect( mockOpen ).toHaveBeenCalledTimes( 1 );

		rerender(
			<MediaUploadModal isOpen={ false } onSelect={ jest.fn() } />
		);
		expect( mockClose ).toHaveBeenCalledTimes( 1 );
		expect( mockClose ).toHaveBeenCalledWith( { session: sessionA } );
	} );

	it( 'dispatches close on unmount while open', () => {
		const { unmount } = render(
			<MediaUploadModal isOpen onSelect={ jest.fn() } />
		);
		expect( mockOpen ).toHaveBeenCalledTimes( 1 );
		unmount();
		expect( mockClose ).toHaveBeenCalledTimes( 1 );
		expect( mockClose ).toHaveBeenCalledWith( { session: sessionA } );
	} );

	it( 'no-ops (with dev warning) when no open function is in settings', () => {
		mockSettings = {}; // No openMediaUploadModalKey injected
		const warnSpy = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => undefined );

		render( <MediaUploadModal isOpen onSelect={ jest.fn() } /> );

		expect( mockOpen ).not.toHaveBeenCalled();
		expect( warnSpy ).toHaveBeenCalled();
		warnSpy.mockRestore();
	} );

	it( 'does not dispatch close on unmount when never opened', () => {
		const { unmount } = render(
			<MediaUploadModal isOpen={ false } onSelect={ jest.fn() } />
		);
		unmount();
		expect( mockClose ).not.toHaveBeenCalled();
	} );
} );
