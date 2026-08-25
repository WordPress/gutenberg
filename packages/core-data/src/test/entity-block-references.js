import { createRegistry } from '@wordpress/data';
import { store as coreDataStore } from '../index';
import {
	findReferencedEntityRecords,
	getEntityReferenceKey,
	isBlockReferencedEntity,
} from '../entity-block-references';

const NAV_KEY = getEntityReferenceKey( 'postType', 'wp_navigation', 42 );

function block( name, attributes = {}, innerBlocks = [] ) {
	return {
		clientId: name + JSON.stringify( attributes ),
		name,
		attributes,
		innerBlocks,
	};
}

describe( 'isBlockReferencedEntity', () => {
	it( 'recognises the entities blocks reference', () => {
		expect( isBlockReferencedEntity( 'postType', 'wp_navigation' ) ).toBe(
			true
		);
		expect( isBlockReferencedEntity( 'postType', 'wp_block' ) ).toBe(
			true
		);
		expect(
			isBlockReferencedEntity( 'postType', 'wp_template_part' )
		).toBe( true );
	} );

	it( 'does not recognise other entities', () => {
		expect( isBlockReferencedEntity( 'postType', 'post' ) ).toBe( false );
		expect( isBlockReferencedEntity( 'root', 'site' ) ).toBe( false );
	} );
} );

describe( 'findReferencedEntityRecords', () => {
	const keys = new Set( [ NAV_KEY ] );

	it( 'finds a reference at the root of the tree', () => {
		const blocks = [ block( 'core/navigation', { ref: 42 } ) ];

		expect( findReferencedEntityRecords( blocks, keys, {} ) ).toEqual(
			new Set( [ NAV_KEY ] )
		);
	} );

	it( 'finds a reference nested in inner blocks', () => {
		const blocks = [
			block( 'core/group', {}, [
				block( 'core/columns', {}, [
					block( 'core/navigation', { ref: 42 } ),
				] ),
			] ),
		];

		expect( findReferencedEntityRecords( blocks, keys, {} ) ).toEqual(
			new Set( [ NAV_KEY ] )
		);
	} );

	it( 'ignores references to other records of the same entity', () => {
		const blocks = [ block( 'core/navigation', { ref: 7 } ) ];

		expect( findReferencedEntityRecords( blocks, keys, {} ) ).toEqual(
			new Set()
		);
	} );

	it( 'ignores a reference with no record ID', () => {
		const blocks = [ block( 'core/navigation', {} ) ];

		expect( findReferencedEntityRecords( blocks, keys, {} ) ).toEqual(
			new Set()
		);
	} );

	it( 'builds a template part reference from its slug and the active theme', () => {
		const key = getEntityReferenceKey(
			'postType',
			'wp_template_part',
			'twentytwentyfive//header'
		);
		const blocks = [ block( 'core/template-part', { slug: 'header' } ) ];

		expect(
			findReferencedEntityRecords( blocks, new Set( [ key ] ), {
				theme: 'twentytwentyfive',
			} )
		).toEqual( new Set( [ key ] ) );
	} );

	it( "prefers the block's own theme attribute over the active theme", () => {
		const key = getEntityReferenceKey(
			'postType',
			'wp_template_part',
			'othertheme//header'
		);
		const blocks = [
			block( 'core/template-part', {
				slug: 'header',
				theme: 'othertheme',
			} ),
		];

		expect(
			findReferencedEntityRecords( blocks, new Set( [ key ] ), {
				theme: 'twentytwentyfive',
			} )
		).toEqual( new Set( [ key ] ) );
	} );

	it( 'returns nothing when there is nothing to look for', () => {
		const blocks = [ block( 'core/navigation', { ref: 42 } ) ];

		expect( findReferencedEntityRecords( blocks, new Set(), {} ) ).toEqual(
			new Set()
		);
	} );
} );

describe( 'edits of entities removed from the document', () => {
	let registry;

	const postEntityConfig = {
		kind: 'postType',
		baseURL: '/wp/v2/posts',
		name: 'post',
		label: 'Posts',
		transientEdits: { blocks: true, selection: true },
		rawAttributes: [ 'title', 'excerpt', 'content' ],
	};

	const navigationEntityConfig = {
		kind: 'postType',
		baseURL: '/wp/v2/navigation',
		name: 'wp_navigation',
		label: 'Navigation Menus',
		transientEdits: { blocks: true, selection: true },
		rawAttributes: [ 'title', 'excerpt', 'content' ],
	};

	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );
		registry
			.dispatch( coreDataStore )
			.addEntities( [ postEntityConfig, navigationEntityConfig ] );
		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'postType', 'post', [
				{ id: 1, title: { raw: 'A post' }, content: { raw: '' } },
			] );
		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'postType', 'wp_navigation', [
				{ id: 42, title: { raw: 'Main' }, content: { raw: '' } },
			] );
	} );

	const navBlock = () => block( 'core/navigation', { ref: 42 } );
	const paragraph = () => block( 'core/paragraph', { content: 'Hi' } );

	function editNavigation() {
		registry
			.dispatch( coreDataStore )
			.editEntityRecord( 'postType', 'wp_navigation', 42, {
				title: 'Main menu',
			} );
	}

	function editPostBlocks( blocks ) {
		registry
			.dispatch( coreDataStore )
			.editEntityRecord( 'postType', 'post', 1, { blocks } );
	}

	const getNavigationEdits = () =>
		registry
			.select( coreDataStore )
			.getEntityRecordEdits( 'postType', 'wp_navigation', 42 );

	it( 'discards them when the referencing block is removed', () => {
		editPostBlocks( [ navBlock(), paragraph() ] );
		editNavigation();

		expect( getNavigationEdits() ).toEqual( { title: 'Main menu' } );

		editPostBlocks( [ paragraph() ] );

		expect( getNavigationEdits() ).toEqual( {} );
		// The navigation menu is no longer listed as an unsaved change.
		expect(
			registry
				.select( coreDataStore )
				.__experimentalGetDirtyEntityRecords()
		).toEqual( [] );
	} );

	it( 'keeps them while another block still references the record', () => {
		editPostBlocks( [ navBlock(), navBlock(), paragraph() ] );
		editNavigation();

		editPostBlocks( [ navBlock(), paragraph() ] );

		expect( getNavigationEdits() ).toEqual( { title: 'Main menu' } );
	} );

	it( 'keeps them when the document never referenced the record', () => {
		editPostBlocks( [ paragraph(), paragraph() ] );
		editNavigation();

		editPostBlocks( [ paragraph() ] );

		expect( getNavigationEdits() ).toEqual( { title: 'Main menu' } );
	} );

	it( 'finds the reference in nested inner blocks', () => {
		editPostBlocks( [ block( 'core/group', {}, [ navBlock() ] ) ] );
		editNavigation();

		editPostBlocks( [ block( 'core/group', {}, [] ) ] );

		expect( getNavigationEdits() ).toEqual( {} );
	} );

	it( 'restores them when the removal is undone', () => {
		editPostBlocks( [ navBlock(), paragraph() ] );
		editNavigation();

		editPostBlocks( [ paragraph() ] );
		expect( getNavigationEdits() ).toEqual( {} );

		registry.dispatch( coreDataStore ).undo();

		expect( getNavigationEdits() ).toEqual( { title: 'Main menu' } );
		expect(
			registry
				.select( coreDataStore )
				.getEditedEntityRecord( 'postType', 'post', 1 ).blocks
		).toHaveLength( 2 );
	} );

	it( 'discards them again when the removal is redone', () => {
		editPostBlocks( [ navBlock(), paragraph() ] );
		editNavigation();
		editPostBlocks( [ paragraph() ] );

		registry.dispatch( coreDataStore ).undo();
		registry.dispatch( coreDataStore ).redo();

		expect( getNavigationEdits() ).toEqual( {} );
	} );
} );
