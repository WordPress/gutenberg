import { resolveRestoreTarget } from '../restore-sidebar';
import { ALL_NOTES_SIDEBAR } from '../constants';

describe( 'resolveRestoreTarget', () => {
	// The composer opened the "All notes" sidebar and it is still the active
	// area, so the flow still owns the slot it took.
	describe( 'when the notes sidebar the flow opened is still active', () => {
		it.each( [
			[ 'the block inspector', 'edit-post/block' ],
			[ 'the document sidebar', 'edit-post/document' ],
			[ 'a plugin sidebar', 'my-plugin/my-sidebar' ],
		] )( 'restores %s', ( _label, capturedArea ) => {
			expect(
				resolveRestoreTarget( {
					capturedArea,
					activeArea: ALL_NOTES_SIDEBAR,
					openedArea: ALL_NOTES_SIDEBAR,
				} )
			).toEqual( { type: 'enable', area: capturedArea } );
		} );

		it.each( [
			[ 'the user had explicitly closed the sidebar', null ],
			[ 'the user had never toggled the sidebar', undefined ],
		] )( 'closes the sidebar when %s', ( _label, capturedArea ) => {
			expect(
				resolveRestoreTarget( {
					capturedArea,
					activeArea: ALL_NOTES_SIDEBAR,
					openedArea: ALL_NOTES_SIDEBAR,
				} )
			).toEqual( { type: 'disable' } );
		} );

		it( 'does nothing when the notes sidebar was already open', () => {
			expect(
				resolveRestoreTarget( {
					capturedArea: ALL_NOTES_SIDEBAR,
					activeArea: ALL_NOTES_SIDEBAR,
					openedArea: ALL_NOTES_SIDEBAR,
				} )
			).toEqual( { type: 'none' } );
		} );
	} );

	// The user moved the sidebars themselves while composing, so restoring
	// would undo their explicit choice.
	describe( 'when the active area changed during composition', () => {
		it.each( [
			[ 'switched to another sidebar', 'edit-post/document' ],
			[ 'closed the notes sidebar', null ],
		] )( 'does nothing when the user %s', ( _label, activeArea ) => {
			expect(
				resolveRestoreTarget( {
					capturedArea: 'edit-post/block',
					activeArea,
					openedArea: ALL_NOTES_SIDEBAR,
				} )
			).toEqual( { type: 'none' } );
		} );
	} );
} );
