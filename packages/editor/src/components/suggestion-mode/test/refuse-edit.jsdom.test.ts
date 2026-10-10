import { describe, expect, it, vi } from 'vitest';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as editorStore } from '../../../store';
import { REFUSED_EDIT_NOTICE_ID, notifyEditRefused } from '../refuse-edit';
import { ALL_NOTES_SIDEBAR } from '../../collab-sidebar/constants';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

// The registry below is a stand-in, so its editor store dispatch is not a
// locked object; pass it through, and keep the real unlock for the rest.
vi.mock( '../../../lock-unlock', async ( importOriginal ) => {
	const actual =
		await importOriginal< typeof import( '../../../lock-unlock' ) >();
	return {
		...actual,
		unlock: ( object: any ) => {
			try {
				return actual.unlock( object );
			} catch {
				return object;
			}
		},
	};
} );

/**
 * A registry stand-in holding the notices, core-data, interface and editor
 * stores the refusal reaches for.
 *
 * @param notes Note comment records by id.
 */
function fakeRegistry( notes: Record< string, any > = {} ) {
	const createNotice = vi.fn();
	const enableComplementaryArea = vi.fn();
	const selectNote = vi.fn();
	const registry = {
		dispatch: ( store: any ) => {
			if ( store === noticesStore ) {
				return { createNotice };
			}
			if ( store === interfaceStore ) {
				return { enableComplementaryArea };
			}
			if ( store === editorStore ) {
				return { selectNote };
			}
			return {};
		},
		select: ( store: any ) =>
			store === coreStore
				? {
						getEntityRecord: (
							kind: string,
							name: string,
							id: number
						) => notes[ String( id ) ],
					}
				: {},
	};
	return { registry, createNotice, enableComplementaryArea, selectNote };
}

const lastNotice = ( createNotice: any ) =>
	createNotice.mock.calls[ createNotice.mock.calls.length - 1 ];

describe( 'notifyEditRefused', () => {
	it( 'keeps the generic message when nothing names the marker', () => {
		const { registry, createNotice } = fakeRegistry();
		notifyEditRefused( registry );
		const [ status, message, options ] = lastNotice( createNotice );
		expect( status ).toBe( 'warning' );
		expect( message ).toBe(
			'This change overlaps a pending suggestion, so it was not captured. Accept or reject that suggestion first.'
		);
		expect( options ).toMatchObject( {
			id: REFUSED_EDIT_NOTICE_ID,
			type: 'snackbar',
		} );
		expect( options.actions ).toBeUndefined();
	} );

	it.each( [
		[
			'add-in-add',
			'add',
			'Anne suggested adding this text. Reply to their suggestion to propose a change.',
		],
		[
			'insert-in-del',
			'del',
			'Anne suggested deleting this text. Reply to their suggestion to propose a change.',
		],
		[ 'del-over-del', 'del', 'Anne already suggested deleting this text.' ],
		[
			'format-on-format',
			'format',
			'Anne already suggested formatting this text.',
		],
		[
			'format-straddles-add',
			'add',
			'This formatting crosses a suggested addition by Anne. Format the added text and the text around it separately.',
		],
	] )( 'names the author for %s', ( reason, kind, expected ) => {
		const { registry, createNotice } = fakeRegistry( {
			7: { id: 7, author_name: 'Anne' },
		} );
		notifyEditRefused( registry, {
			reason: reason as any,
			blocking: { id: '7', kind: kind as any, authorId: '2' },
		} );
		expect( lastNotice( createNotice )[ 1 ] ).toBe( expected );
	} );

	it( 'falls back to a name-free message when the author is unknown', () => {
		const { registry, createNotice } = fakeRegistry();
		notifyEditRefused( registry, {
			reason: 'del-over-del',
			blocking: { id: '7', kind: 'del', authorId: '2' },
		} );
		expect( lastNotice( createNotice )[ 1 ] ).toBe(
			'Someone already suggested deleting this text.'
		);
	} );

	it( 'offers to reply to the suggestion in the way, and keeps the snackbar up', () => {
		const { registry, createNotice, enableComplementaryArea, selectNote } =
			fakeRegistry( { 7: { id: 7, author_name: 'Anne' } } );
		notifyEditRefused( registry, {
			reason: 'add-in-add',
			blocking: { id: '7', kind: 'add', authorId: '2' },
		} );
		const options = lastNotice( createNotice )[ 2 ];
		expect( options.id ).toBe( REFUSED_EDIT_NOTICE_ID );
		expect( options.explicitDismiss ).toBe( true );
		expect( options.actions ).toHaveLength( 1 );
		expect( options.actions[ 0 ].label ).toBe( 'Reply to this suggestion' );
		options.actions[ 0 ].onClick();
		expect( enableComplementaryArea ).toHaveBeenCalledWith(
			'core',
			ALL_NOTES_SIDEBAR
		);
		expect( selectNote ).toHaveBeenCalledWith( 7, { focus: true } );
	} );

	it( 'keeps the generic message for the author’s own markers', () => {
		const { registry, createNotice } = fakeRegistry( {
			7: { id: 7, author_name: 'Anne' },
		} );
		notifyEditRefused( registry, {
			reason: 'own-marker',
			blocking: { id: '7', kind: 'del', authorId: '1' },
		} );
		const [ , message, options ] = lastNotice( createNotice );
		expect( message ).toContain( 'overlaps a pending suggestion' );
		expect( options.actions ).toBeUndefined();
	} );
} );
