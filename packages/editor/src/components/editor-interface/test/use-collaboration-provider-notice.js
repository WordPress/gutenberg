/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useCollaborationProviderNotice from '../use-collaboration-provider-notice';

const createWarningNotice = jest.fn();
const removeNotice = jest.fn();

jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );

describe( 'useCollaborationProviderNotice', () => {
	beforeEach( () => {
		useDispatch.mockReturnValue( {
			createWarningNotice,
			removeNotice,
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'creates and removes a warning when collaboration has no provider', () => {
		const { unmount } = renderHook( () =>
			useCollaborationProviderNotice( {
				isCollaborationEnabled: true,
				hasProviders: false,
			} )
		);

		expect( createWarningNotice ).toHaveBeenCalledWith(
			'Real-time collaboration is enabled, but no collaboration provider is registered.',
			{
				id: 'editor-missing-collaboration-provider',
				isDismissible: true,
			}
		);

		unmount();
		expect( removeNotice ).toHaveBeenCalledWith(
			'editor-missing-collaboration-provider'
		);
	} );

	it.each( [
		[ false, false ],
		[ true, true ],
	] )(
		'does not warn when collaboration enabled is %s and provider availability is %s',
		( isCollaborationEnabled, hasProviders ) => {
			renderHook( () =>
				useCollaborationProviderNotice( {
					isCollaborationEnabled,
					hasProviders,
				} )
			);

			expect( createWarningNotice ).not.toHaveBeenCalled();
		}
	);
} );
