import { describe, expect, it, vi } from 'vitest';
import deepFreeze from 'deep-freeze';
import {
	getEntityActionsConfig,
	getFieldsConfig,
	getTemplateId,
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

describe( 'getEntityActionsConfig', () => {
	it( 'returns undefined until the actions of the entity are received', () => {
		const state = { entityActionsConfigs: {} };

		expect(
			getEntityActionsConfig( state, 'postType', 'page' )
		).toBeUndefined();
	} );

	it( 'returns the received actions of the entity', () => {
		const config = { kind: 'postType', name: 'page', actions: [] };
		const state = { entityActionsConfigs: { postType: { page: config } } };

		expect( getEntityActionsConfig( state, 'postType', 'page' ) ).toBe(
			config
		);
		expect(
			getEntityActionsConfig( state, 'postType', 'post' )
		).toBeUndefined();
	} );
} );

describe( 'getTemplateId', () => {
	function setUpRegistry( { editedTemplate, templates } ) {
		getTemplateId.registry = {
			select: () => ( {
				getEditedEntityRecord: () => editedTemplate,
				getEntityRecords: () => templates,
			} ),
		};
	}

	const layout = { id: 'theme//layout', slug: 'layout' };

	it( 'returns undefined until the edited template is received', () => {
		setUpRegistry( { editedTemplate: undefined, templates: [ layout ] } );

		expect(
			getTemplateId( {}, 'wp_template', 'theme//page-404' )
		).toBeUndefined();
	} );

	it( 'returns null for a template that names no template to render inside', () => {
		setUpRegistry( {
			editedTemplate: { slug: 'page-404', template: '' },
			templates: [ layout ],
		} );

		expect(
			getTemplateId( {}, 'wp_template', 'theme//page-404' )
		).toBeNull();
	} );

	it( 'returns the ID of the template it names', () => {
		setUpRegistry( {
			editedTemplate: { slug: 'page-404', template: 'layout' },
			templates: [ layout ],
		} );

		expect( getTemplateId( {}, 'wp_template', 'theme//page-404' ) ).toBe(
			'theme//layout'
		);
	} );

	it( 'returns undefined until the templates are received', () => {
		setUpRegistry( {
			editedTemplate: { slug: 'page-404', template: 'layout' },
			templates: undefined,
		} );

		expect(
			getTemplateId( {}, 'wp_template', 'theme//page-404' )
		).toBeUndefined();
	} );

	it( 'returns null when the template it names no longer exists', () => {
		setUpRegistry( {
			editedTemplate: { slug: 'page-404', template: 'deleted' },
			templates: [ layout ],
		} );

		expect(
			getTemplateId( {}, 'wp_template', 'theme//page-404' )
		).toBeNull();
	} );
} );
