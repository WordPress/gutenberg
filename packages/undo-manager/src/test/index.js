/**
 * Internal dependencies
 */
import { createUndoManager } from '../';

describe( 'Undo Manager', () => {
	it( 'stacks undo levels', () => {
		const manager = createUndoManager();

		manager.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		expect( manager.undo() ).toEqual( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		manager.redo();

		manager.addRecord( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );
		manager.addRecord( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );
		expect( manager.undo() ).toEqual( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );
	} );

	it( 'handles undos/redos', () => {
		const manager = createUndoManager();
		manager.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		manager.addRecord( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );
		manager.addRecord( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );

		manager.undo();
		expect( manager.undo() ).toEqual( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );
		manager.redo();
		expect( manager.redo() ).toEqual( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );

		manager.undo();
		manager.undo();
		expect( manager.undo() ).toEqual( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		manager.redo();
		expect( manager.redo() ).toEqual( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );

		manager.redo();
		expect( manager.undo() ).toEqual( [
			{ id: '1', changes: { value: { from: 2, to: 3 } } },
		] );
		manager.redo();

		manager.addRecord( [
			{ id: '1', changes: { value: { from: 3, to: 4 } } },
		] );
		expect( manager.undo() ).toEqual( [
			{ id: '1', changes: { value: { from: 3, to: 4 } } },
		] );

		// Check that undoing and editing will slice of
		// all the levels after the current one.
		manager.undo();
		manager.addRecord( [
			{ id: '1', changes: { value: { from: 2, to: 5 } } },
		] );
		manager.undo();
		expect( manager.undo() ).toEqual( [
			{ id: '1', changes: { value: { from: 1, to: 2 } } },
		] );
	} );

	it( 'handles staged edits', () => {
		const manager = createUndoManager();
		manager.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		manager.addRecord(
			[ { id: '1', changes: { value2: { from: undefined, to: 2 } } } ],
			true
		);
		manager.addRecord(
			[ { id: '1', changes: { value: { from: 1, to: 3 } } } ],
			true
		);
		manager.addRecord( [
			{ id: '1', changes: { value: { from: 3, to: 4 } } },
		] );
		manager.undo();
		expect( manager.undo() ).toEqual( [
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
		const manager = createUndoManager();
		manager.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		// These three calls do nothing because they're empty.
		manager.addRecord( [] );
		manager.addRecord();
		manager.addRecord( [
			{ id: '1', changes: { value: { from: 1, to: 1 } } },
		] );
		// Check that nothing happens if there are no pending
		// transient edits.
		manager.undo();
		expect( manager.undo() ).toBe( undefined );
		manager.redo();

		// Check that transient edits are merged into the last
		// edits.
		manager.addRecord(
			[ { id: '1', changes: { value2: { from: undefined, to: 2 } } } ],
			true
		);
		manager.addRecord( [] ); // Records the staged edits.
		manager.undo();
		expect( manager.redo() ).toEqual( [
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
		const manager = createUndoManager();
		manager.addRecord( [
			{ id: '1', changes: { value: { from: undefined, to: 1 } } },
		] );
		manager.addRecord(
			[ { id: '1', changes: { value2: { from: undefined, to: 2 } } } ],
			true
		);
		manager.undo();
		expect( manager.redo() ).toEqual( [
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
		const manager = createUndoManager();

		manager.addRecord(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: { value: { from: undefined, to: 1 } },
				},
			],
			true
		);
		manager.addRecord(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: { value2: { from: undefined, to: 2 } },
				},
			],
			true
		);
		manager.addRecord(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 2 },
					changes: { value: { from: undefined, to: 3 } },
				},
			],
			true
		);
		manager.addRecord();
		expect( manager.undo() ).toEqual( [
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
		const manager = createUndoManager();

		// All the following changes are considered empty for different reasons.
		manager.addRecord();
		manager.addRecord( [] );
		manager.addRecord( [
			{ id: '1', changes: { a: { from: 'value', to: 'value' } } },
		] );
		manager.addRecord( [
			{
				id: '1',
				changes: {
					a: { from: 'value', to: 'value' },
					b: { from: () => {}, to: () => {} },
				},
			},
		] );

		expect( manager.undo() ).toBeUndefined();

		// The following changes is not empty
		// and should also record the function changes in the history.

		manager.addRecord( [
			{
				id: '1',
				changes: {
					a: { from: 'value1', to: 'value2' },
					b: { from: () => {}, to: () => {} },
				},
			},
		] );

		const undoRecord = manager.undo();
		expect( undoRecord ).not.toBeUndefined();
		// b is included in the changes.
		expect( Object.keys( undoRecord[ 0 ].changes ) ).toEqual( [
			'a',
			'b',
		] );
	} );
} );
