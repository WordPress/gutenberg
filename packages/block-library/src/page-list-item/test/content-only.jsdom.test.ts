import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import { createRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import navigationMetadata from '../../navigation/block.json';
import pageListMetadata from '../../page-list/block.json';
import metadata from '../block.json';
import { unlock } from '../../lock-unlock';

function setupPageList() {
	const child = createBlock( 'core/page-list-item', {
		id: 3,
		label: 'Child page',
	} );
	const parent = createBlock(
		'core/page-list-item',
		{ id: 2, label: 'Parent page', hasChildren: true },
		[ child ]
	);
	const pageList = createBlock( 'core/page-list', {}, [ parent ] );
	const navigation = createBlock(
		'core/navigation',
		{ templateLock: 'contentOnly' },
		[ pageList ]
	);
	const registry = createRegistry();
	registry.register( blockEditorStore );
	registry.dispatch( blockEditorStore ).resetBlocks( [ navigation ] );
	registry
		.dispatch( blockEditorStore )
		.updateBlockListSettings( navigation.clientId, {
			templateLock: 'contentOnly',
		} );

	return { registry, pageList, parent, child };
}

describe( 'Page List items in content-only navigation', () => {
	beforeEach( () => {
		for ( const blockMetadata of [
			navigationMetadata,
			pageListMetadata,
			metadata,
		] ) {
			registerBlockType( blockMetadata as BlockConfiguration, {
				save: () => null,
			} );
		}
	} );

	afterEach( () => {
		for ( const name of [
			navigationMetadata.name,
			pageListMetadata.name,
			metadata.name,
		] ) {
			unregisterBlockType( name );
		}
	} );

	it( 'keeps generated page items and their hierarchy in List View', () => {
		const { registry, pageList, parent, child } = setupPageList();

		expect(
			unlock(
				registry.select( blockEditorStore )
			).getListViewClientIdsTree( pageList.clientId )
		).toEqual( [
			{
				clientId: parent.clientId,
				innerBlocks: [ { clientId: child.clientId, innerBlocks: [] } ],
			},
		] );
	} );

	it( 'still hides an explicitly disabled page item and its descendants', () => {
		const { registry, pageList, parent } = setupPageList();
		registry
			.dispatch( blockEditorStore )
			.setBlockEditingMode( parent.clientId, 'disabled' );

		expect(
			unlock(
				registry.select( blockEditorStore )
			).getListViewClientIdsTree( pageList.clientId )
		).toEqual( [] );
	} );
} );
