import { describe, expect, it, vi } from 'vitest';
import deepFreeze from 'deep-freeze';
import {
	getEntityActionsConfig,
	getFieldsConfig,
	getTemplateId,
	getUndoManager,
} from '../private-selectors';
import type { State } from '../selectors';

type DeepPartial< T > = T extends ( ...args: Array< never > ) => unknown
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

describe( 'getTemplateId', () => {
	type TestTemplate = { id: string; slug: string; template?: string };

	function setUpRegistry( {
		editedTemplate,
		templates,
	}: {
		editedTemplate?: Partial< TestTemplate >;
		templates?: TestTemplate[];
	} ) {
		getTemplateId.registry = {
			select: () => ( {
				getEditedEntityRecord: () => editedTemplate,
				getEntityRecords: () => templates,
			} ),
		} as never;
	}

	const layout: TestTemplate = { id: 'theme//layout', slug: 'layout' };

	it( 'returns undefined until the edited template is received', () => {
		setUpRegistry( { editedTemplate: undefined, templates: [ layout ] } );

		expect(
			getTemplateId(
				partialState( {} ),
				'wp_template',
				'theme//page-404'
			)
		).toBeUndefined();
	} );

	it( 'returns null for a template that names no template to render inside', () => {
		setUpRegistry( {
			editedTemplate: { slug: 'page-404', template: '' },
			templates: [ layout ],
		} );

		expect(
			getTemplateId(
				partialState( {} ),
				'wp_template',
				'theme//page-404'
			)
		).toBeNull();
	} );

	it( 'returns the ID of the template it names', () => {
		setUpRegistry( {
			editedTemplate: { slug: 'page-404', template: 'layout' },
			templates: [ layout ],
		} );

		expect(
			getTemplateId(
				partialState( {} ),
				'wp_template',
				'theme//page-404'
			)
		).toBe( 'theme//layout' );
	} );

	it( 'returns undefined until the templates are received', () => {
		setUpRegistry( {
			editedTemplate: { slug: 'page-404', template: 'layout' },
			templates: undefined,
		} );

		expect(
			getTemplateId(
				partialState( {} ),
				'wp_template',
				'theme//page-404'
			)
		).toBeUndefined();
	} );

	it( 'returns null when the template it names no longer exists', () => {
		setUpRegistry( {
			editedTemplate: { slug: 'page-404', template: 'deleted' },
			templates: [ layout ],
		} );

		expect(
			getTemplateId(
				partialState( {} ),
				'wp_template',
				'theme//page-404'
			)
		).toBeNull();
	} );
} );
