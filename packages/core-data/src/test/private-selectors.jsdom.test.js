import { describe, expect, it, vi } from 'vitest';
import deepFreeze from 'deep-freeze';
import {
	getActionsConfig,
	getFieldsConfig,
	getUndoManager,
} from '../private-selectors';

describe( 'getUndoManager', () => {
	it( 'returns the undo manager held in state', () => {
		const undoManager = {
			addRecord: vi.fn(),
			hasRedo: vi.fn(),
			hasUndo: vi.fn(),
			redo: vi.fn(),
			undo: vi.fn(),
		};

		expect( getUndoManager( { undoManager } ) ).toBe( undoManager );
	} );
} );

describe( 'getFieldsConfig', () => {
	it( 'returns undefined until the fields of the entity are received', () => {
		const state = deepFreeze( { fieldsConfigs: {} } );

		expect( getFieldsConfig( state, 'postType', 'page' ) ).toBeUndefined();
	} );

	it( 'returns the received fields of the entity', () => {
		const config = { kind: 'postType', name: 'page', fields: [] };
		const state = deepFreeze( {
			fieldsConfigs: { postType: { page: config } },
		} );

		expect( getFieldsConfig( state, 'postType', 'page' ) ).toBe( config );
		expect( getFieldsConfig( state, 'postType', 'post' ) ).toBeUndefined();
	} );
} );

describe( 'getActionsConfig', () => {
	it( 'returns undefined until the actions of the entity are received', () => {
		const state = deepFreeze( { actionsConfigs: {} } );

		expect( getActionsConfig( state, 'postType', 'page' ) ).toBeUndefined();
	} );

	it( 'returns the received actions of the entity', () => {
		const config = { kind: 'postType', name: 'page', actions: [] };
		const state = deepFreeze( {
			actionsConfigs: { postType: { page: config } },
		} );

		expect( getActionsConfig( state, 'postType', 'page' ) ).toBe( config );
		expect( getActionsConfig( state, 'postType', 'post' ) ).toBeUndefined();
	} );
} );
