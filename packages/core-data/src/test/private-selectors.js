import { createRegistry } from '@wordpress/data';
import { store as coreStore } from '..';
import { getUndoManager } from '../private-selectors';
import { getSyncManager } from '../sync';
import { unlock } from '../lock-unlock';

jest.mock( '../sync', () => ( {
	getSyncManager: jest.fn(),
} ) );

describe( 'getUndoManager', () => {
	afterEach( () => {
		getSyncManager.mockReset();
	} );

	it( 'returns the sync undo manager when one is available', () => {
		const syncUndoManager = {
			addRecord: jest.fn(),
			hasRedo: jest.fn(),
			hasUndo: jest.fn(),
			redo: jest.fn(),
			undo: jest.fn(),
		};
		const fallbackUndoManager = {
			addRecord: jest.fn(),
			hasRedo: jest.fn(),
			hasUndo: jest.fn(),
			redo: jest.fn(),
			undo: jest.fn(),
		};
		getSyncManager.mockReturnValue( {
			undoManager: syncUndoManager,
		} );

		const state = {
			undoManager: fallbackUndoManager,
			syncUndoManagerState: {
				hasRedo: false,
				hasUndo: false,
			},
		};

		expect( getUndoManager( state ) ).toBe( syncUndoManager );
	} );

	it( 'returns the default undo manager when there is no sync undo manager', () => {
		const fallbackUndoManager = {
			addRecord: jest.fn(),
			hasRedo: jest.fn(),
			hasUndo: jest.fn(),
			redo: jest.fn(),
			undo: jest.fn(),
		};
		getSyncManager.mockReturnValue( undefined );

		expect(
			getUndoManager( {
				undoManager: fallbackUndoManager,
				syncUndoManagerState: {
					hasRedo: false,
					hasUndo: false,
				},
			} )
		).toBe( fallbackUndoManager );
	} );
} );

describe( 'getTemplateId', () => {
	function createRegistryWithTemplates() {
		const registry = createRegistry();
		registry.register( coreStore );
		const { receiveEntityRecords, addEntities } =
			registry.dispatch( coreStore );

		// A static front page makes home page resolution synchronous.
		receiveEntityRecords( 'root', '__unstableBase', {
			show_on_front: 'page',
			page_on_front: 2,
		} );
		addEntities( [
			{ kind: 'postType', name: 'post', baseURL: '/wp/v2/posts' },
			{
				kind: 'postType',
				name: 'wp_template',
				baseURL: '/wp/v2/templates',
			},
		] );
		receiveEntityRecords(
			'postType',
			'wp_template',
			[ { id: 'theme//custom', slug: 'custom' } ],
			{ per_page: -1 }
		);
		return registry;
	}

	it( 'resolves the assigned template for a post', () => {
		const registry = createRegistryWithTemplates();
		registry
			.dispatch( coreStore )
			.receiveEntityRecords( 'postType', 'post', [
				{ id: 1, slug: 'hello-world', template: 'custom' },
			] );

		expect(
			unlock( registry.select( coreStore ) ).getTemplateId( 'post', 1 )
		).toBe( 'theme//custom' );
	} );

	it.each( [
		[ 'wp_template', 'theme//single', 'single' ],
		[ 'wp_template_part', 'theme//header', 'header' ],
		[ 'wp_block', 7, 'my-pattern' ],
		[ 'wp_navigation', 8, 'main-menu' ],
		[ 'attachment', 9, 'my-image' ],
	] )(
		'returns undefined for %s, which does not render inside a parent template',
		( postType, postId, slug ) => {
			const registry = createRegistryWithTemplates();
			const {
				receiveEntityRecords,
				receiveDefaultTemplateId,
				addEntities,
			} = registry.dispatch( coreStore );
			if ( postType !== 'wp_template' ) {
				addEntities( [
					{
						kind: 'postType',
						name: postType,
						baseURL: `/wp/v2/${ postType }`,
					},
				] );
			}
			receiveEntityRecords( 'postType', postType, [
				{ id: postId, slug },
			] );
			// Seed the fallback the template hierarchy would resolve to, to
			// prove the selector does not consult it.
			receiveDefaultTemplateId(
				{ slug: `single-${ postType }-${ slug }` },
				'theme//index'
			);

			expect(
				unlock( registry.select( coreStore ) ).getTemplateId(
					postType,
					postId
				)
			).toBeUndefined();
		}
	);
} );
