import { describe, expect, it, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { SlotFillProvider } from '@wordpress/components';
import useInspectorControlsTabs from '../use-inspector-controls-tabs';

function renderTabs( blockName = 'core/paragraph' ) {
	return renderHook( () => useInspectorControlsTabs( blockName ), {
		wrapper: SlotFillProvider,
	} ).result;
}

describe( 'useInspectorControlsTabs — editor.InspectorControlsTabs filter', () => {
	afterEach( () => {
		removeFilter( 'editor.InspectorControlsTabs', 'test/add-tab' );
		removeFilter( 'editor.InspectorControlsTabs', 'test/remove-tab' );
		removeFilter(
			'editor.InspectorControlsTabs',
			'test/receives-block-name'
		);
	} );

	it( 'lets a filter add a tab to the list', () => {
		addFilter( 'editor.InspectorControlsTabs', 'test/add-tab', ( tabs ) => [
			...tabs,
			{ name: 'my-plugin/tab', title: 'My Tab' },
		] );

		const view = renderTabs();

		expect(
			view.current.some( ( tab ) => tab.name === 'my-plugin/tab' )
		).toBe( true );
	} );

	it( 'lets a filter remove a tab from the list', () => {
		addFilter( 'editor.InspectorControlsTabs', 'test/add-tab', ( tabs ) => [
			...tabs,
			{ name: 'my-plugin/tab', title: 'My Tab' },
		] );
		addFilter(
			'editor.InspectorControlsTabs',
			'test/remove-tab',
			( tabs ) => tabs.filter( ( tab ) => tab.name !== 'my-plugin/tab' ),
			20
		);

		const view = renderTabs();

		expect(
			view.current.some( ( tab ) => tab.name === 'my-plugin/tab' )
		).toBe( false );
	} );

	it( 'passes the block name as the second filter argument', () => {
		let receivedBlockName;
		addFilter(
			'editor.InspectorControlsTabs',
			'test/receives-block-name',
			( tabs, blockName ) => {
				receivedBlockName = blockName;
				return tabs;
			}
		);

		renderTabs( 'my-plugin/swiper' );

		expect( receivedBlockName ).toBe( 'my-plugin/swiper' );
	} );
} );
