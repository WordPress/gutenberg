import { describe, expect, it, vi } from 'vitest';
import deepFreeze from 'deep-freeze';
import {
	getEntityActionsConfig,
	getFieldsConfig,
	getUndoManager,
} from '../private-selectors';
import type { State } from '../selectors';

type DeepPartial< T > = T extends ( ...args: never[] ) => unknown
	? T
	: T extends object
		? { [ K in keyof T ]?: DeepPartial< T[ K ] > }
		: T;

/**
 * Types a state that holds only the fields the selector under test reads.
 *
 * @param value The partial state.
 */
function partialState( value: DeepPartial< State > ): State {
	return value as State;
}

/**
 * Freezes a partial state to catch mutations, keeping it writable to the
 * type checker as the selector under test expects.
 *
 * @param value The partial state.
 */
function frozenState( value: DeepPartial< State > ): State {
	return deepFreeze( value ) as State;
}

describe( 'getUndoManager', () => {
	it( 'returns the undo manager held in state', () => {
		const undoManager = {
			addRecord: vi.fn(),
			hasRedo: vi.fn(),
			hasUndo: vi.fn(),
			redo: vi.fn(),
			undo: vi.fn(),
		};

		expect( getUndoManager( partialState( { undoManager } ) ) ).toBe(
			undoManager
		);
	} );
} );

describe( 'getFieldsConfig', () => {
	it( 'returns undefined until the fields of the entity are received', () => {
		const state = frozenState( { fieldsConfigs: {} } );

		expect( getFieldsConfig( state, 'postType', 'page' ) ).toBeUndefined();
	} );

	it( 'returns the received fields of the entity', () => {
		const config = { kind: 'postType', name: 'page', fields: [] };
		const state = frozenState( {
			fieldsConfigs: { postType: { page: config } },
		} );

		expect( getFieldsConfig( state, 'postType', 'page' ) ).toBe( config );
		expect( getFieldsConfig( state, 'postType', 'post' ) ).toBeUndefined();
	} );
} );

describe( 'getEntityActionsConfig', () => {
	it( 'returns undefined until the actions of the entity are received', () => {
		const state = partialState( { entityActionsConfigs: {} } );

		expect(
			getEntityActionsConfig( state, 'postType', 'page' )
		).toBeUndefined();
	} );

	it( 'returns the received actions of the entity', () => {
		const config = { kind: 'postType', name: 'page', actions: [] };
		const state = partialState( {
			entityActionsConfigs: { postType: { page: config } },
		} );

		expect( getEntityActionsConfig( state, 'postType', 'page' ) ).toBe(
			config
		);
		expect(
			getEntityActionsConfig( state, 'postType', 'post' )
		).toBeUndefined();
	} );
} );
