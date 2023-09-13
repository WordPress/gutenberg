/**
 * Internal dependencies
 */
import { createUndoManager } from '../';

describe( 'Undo Manager', () => {
	it( 'stacks undo levels', () => {
		const undo = createUndoManager();

		undo.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );

		undo.addRecord( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );
		undo.addRecord( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );
	} );

	it( 'handles undos/redos', () => {
		const undo = createUndoManager();
		undo.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		undo.addRecord( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );
		undo.addRecord( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );

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

		undo.addRecord( [
			{ id: '1', changes: { value: { from: 3, to: 4 } } },
		] );
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 3, to: 4 } } },
		] );

		// Check that undoing and editing will slice of
		// all the levels after the current one.
		undo.undo();
		undo.undo();
		undo.addRecord( [
			{ id: '1', changes: { value: { from: 2, to: 5 } } },
		] );
		undo.undo();
		expect( undo.getUndoRecord() ).toEqual( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );
	} );

	it( 'handles staged edits', () => {
		const undo = createUndoManager();
		undo.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		undo.addRecord(
			[ { id: '1', changes: { value2: { from: undefined, to: 2 } } } ],
			true
		);
		undo.addRecord(
			[ { id: '1', changes: { value: { from: 1, to: 3 } } } ],
			true
		);
		undo.addRecord( [
			{ id: '1', changes: { value: { from: 3, to: 4 } } },
		] );
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
		undo.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		// These three calls do nothing because they're empty.
		undo.addRecord( [] );
		undo.addRecord();
		undo.addRecord( [
			{ id: '1', changes: { value: { from: 1, to: 1 } } },
		] );
		// Check that nothing happens if there are no pending
		// transient edits.
		undo.undo();
		expect( undo.getUndoRecord() ).toBe( undefined );
		undo.redo();

		// Check that transient edits are merged into the last
		// edits.
		undo.addRecord(
			[ { id: '1', changes: { value2: { from: undefined, to: 2 } } } ],
			true
		);
		undo.addRecord( [] ); // Records the staged edits.
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
		undo.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		undo.addRecord(
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

		undo.addRecord(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: { value: { from: undefined, to: 1 } },
				},
			],
			true
		);
		undo.addRecord(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: { value2: { from: undefined, to: 2 } },
				},
			],
			true
		);
		undo.addRecord(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 2 },
					changes: { value: { from: undefined, to: 3 } },
				},
			],
			true
		);
		undo.addRecord();
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

	it( 'should ignore empty records', () => {
		const undo = createUndoManager();

		// All the following changes are considered empty for different reasons.
		undo.addRecord();
		undo.addRecord( [] );
		undo.addRecord( [
			{ id: '1', changes: { a: { from: 'value', to: 'value' } } },
		] );
		undo.addRecord( [
			{
				id: '1',
				changes: {
					a: { from: 'value', to: 'value' },
					b: { from: () => {}, to: () => {} },
				},
			},
		] );

		expect( undo.getUndoRecord() ).toBeUndefined();

		// The following changes is not empty
		// and should also record the function changes in the history.

		undo.addRecord( [
			{
				id: '1',
				changes: {
					a: { from: 'value1', to: 'value2' },
					b: { from: () => {}, to: () => {} },
				},
			},
		] );

		const undoRecord = undo.getUndoRecord();
		expect( undoRecord ).not.toBeUndefined();
		// b is included in the changes.
		expect( Object.keys( undoRecord[ 0 ].changes ) ).toEqual( [
			'a',
			'b',
		] );
	} );
} );
