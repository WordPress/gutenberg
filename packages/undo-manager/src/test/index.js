/**
 * Internal dependencies
 */
import { createUndoManager } from '../';

describe( 'Undo Manager', () => {
	it( 'stacks undo levels', () => {
		const undo = createUndoManager();

		undo.record( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );

		undo.record( [ { id: '1', changes: { value: { from: 1, to: 2 } } } ] );
		undo.record( [ { id: '1', changes: { value: { from: 2, to: 3 } } } ] );
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );
	} );

	it( 'handles undos/redos', () => {
		const undo = createUndoManager();
		undo.record( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		undo.record( [ { id: '1', changes: { value: { from: 1, to: 2 } } } ] );
		undo.record( [ { id: '1', changes: { value: { from: 2, to: 3 } } } ] );

		undo.undo();
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );
		expect( undo.getRedoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );

		undo.undo();
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		expect( undo.getRedoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );

		undo.redo();
		undo.redo();
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );

		undo.record( [ { id: '1', changes: { value: { from: 3, to: 4 } } } ] );
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 3, to: 4 } } },
		] );

		// Check that undoing and editing will slice of
		// all the levels after the current one.
		undo.undo();
		undo.undo();
		undo.record( [ { id: '1', changes: { value: { from: 2, to: 5 } } } ] );
		undo.undo();
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );
	} );

	it( 'handles cached edits', () => {
		const undo = createUndoManager();
		undo.record( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		undo.record(
			[ { id: '1', changes: { value2: { from: undefined, to: 2 } } } ],
			true
		);
		undo.record(
			[ { id: '1', changes: { value: { from: 1, to: 3 } } } ],
			true
		);
		undo.record( [ { id: '1', changes: { value: { from: 3, to: 4 } } } ] );
		undo.undo();
		expect( undo.getUndoRecord() ).toEqual( [
			{
				id: '1',
				changes: {
					value: { from: undefined, to: 3 },
					value2: { from: undefined, to: 2 },
				},
			},
		] );
	} );

	it( 'handles explicit undo level creation', () => {
		const undo = createUndoManager();
		undo.record( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		undo.record( [] );
		undo.record();
		undo.undo();
		// Check that nothing happens if there are no pending
		// transient edits.
		expect( undo.getUndoRecord() ).toBe( undefined );
		undo.redo();

		// Check that transient edits are merged into the last
		// edits.
		undo.record(
			[ { id: '1', changes: { value2: { from: undefined, to: 2 } } } ],
			true
		);
		undo.record( [] ); // Records the cached edits.
		undo.undo();
		expect( undo.getRedoRecord() ).toEqual( [
			{
				id: '1',
				changes: {
					value: { from: undefined, to: 1 },
					value2: { from: undefined, to: 2 },
				},
			},
		] );
	} );

	it( 'explicitly creates an undo level when undoing while there are pending transient edits', () => {
		const undo = createUndoManager();
		undo.record( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		undo.record(
			[ { id: '1', changes: { value2: { from: undefined, to: 2 } } } ],
			true
		);
		undo.undo();
		expect( undo.getRedoRecord() ).toEqual( [
			{
				id: '1',
				changes: {
					value: { from: undefined, to: 1 },
					value2: { from: undefined, to: 2 },
				},
			},
		] );
	} );

	it( 'supports records as ids', () => {
		const undo = createUndoManager();

		undo.record(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: { value: { from: undefined, to: 1 } },
				},
			],
			true
		);
		undo.record(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: { value2: { from: undefined, to: 2 } },
				},
			],
			true
		);
		undo.record(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 2 },
					changes: { value: { from: undefined, to: 3 } },
				},
			],
			true
		);
		undo.record();
		expect( undo.getUndoRecord() ).toEqual( [
			{
				id: { kind: 'postType', name: 'post', recordId: 1 },
				changes: {
					value: { from: undefined, to: 1 },
					value2: { from: undefined, to: 2 },
				},
			},
			{
				id: { kind: 'postType', name: 'post', recordId: 2 },
				changes: {
					value: { from: undefined, to: 3 },
				},
			},
		] );
	} );
} );
