import { describe, expect, it, vi } from 'vitest';
import { store as noticesStore } from '@wordpress/notices';
import { REFUSED_EDIT_NOTICE_ID, notifyEditRefused } from '../refuse-edit';

/**
 * A registry stand-in holding the notices store the refusal reaches for.
 */
function fakeRegistry() {
	const createNotice = vi.fn();
	const registry = {
		dispatch: ( store: any ) =>
			store === noticesStore ? { createNotice } : {},
	};
	return { registry, createNotice };
}

describe( 'notifyEditRefused', () => {
	it( 'shows one replaceable warning snackbar', () => {
		const { registry, createNotice } = fakeRegistry();
		notifyEditRefused( registry );
		notifyEditRefused( registry );
		expect( createNotice ).toHaveBeenCalledTimes( 2 );
		const [ status, message, options ] = createNotice.mock.calls[ 1 ];
		expect( status ).toBe( 'warning' );
		expect( message ).toBe(
			'This change overlaps a pending suggestion, so it was not captured. Accept or reject that suggestion first.'
		);
		expect( options ).toEqual( {
			id: REFUSED_EDIT_NOTICE_ID,
			type: 'snackbar',
			isDismissible: true,
		} );
	} );

	it( 'does nothing without a notices store', () => {
		expect( () =>
			notifyEditRefused( { dispatch: () => ( {} ) } )
		).not.toThrow();
		expect( () => notifyEditRefused( undefined ) ).not.toThrow();
	} );
} );
