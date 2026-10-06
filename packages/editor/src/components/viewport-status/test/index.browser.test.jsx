import { beforeEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import ViewportStatus from '../';
import '../style.scss';

/** @type {ReturnType<typeof createRegistry>} */
let registry;

beforeEach( () => {
	registry = createRegistry();
	registry.register( coreStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	unlock( registry.dispatch( blockEditorStore ) ).resetZoomLevel();
	unlock( registry.dispatch( editorStore ) ).setCanvasWidth( 781 );
	unlock( registry.dispatch( editorStore ) ).setCanvasHeight( 640 );
} );

it( 'updates viewport dimensions when the canvas changes size', async () => {
	await render(
		<RegistryProvider value={ registry }>
			<ViewportStatus />
		</RegistryProvider>
	);
	await expect
		.element( page.getByText( 'Tablet (781 × 640)' ) )
		.toBeVisible();

	const actions = unlock( registry.dispatch( editorStore ) );
	actions.setCanvasWidth( 400.4 );
	actions.setCanvasHeight( 600.6 );
	await expect
		.element( page.getByText( 'Mobile (400 × 601)' ) )
		.toBeVisible();

	actions.setCanvasHeight( undefined );
	await expect
		.element( page.getByText( 'Mobile (400 × auto)' ) )
		.toBeVisible();
} );

it( 'shows responsive editing status when enabled and removes it when disabled', async () => {
	await render(
		<RegistryProvider value={ registry }>
			<ViewportStatus />
		</RegistryProvider>
	);
	await expect
		.element( page.getByText( 'Responsive styles', { exact: true } ) )
		.not.toBeInTheDocument();

	const actions = unlock( registry.dispatch( blockEditorStore ) );
	actions.setResponsiveEditing( true );
	await expect
		.element( page.getByText( 'Responsive styles', { exact: true } ) )
		.toBeVisible();
	actions.setResponsiveEditing( false );
	await expect
		.element( page.getByText( 'Responsive styles', { exact: true } ) )
		.not.toBeInTheDocument();
	await expect
		.element( page.getByText( 'Tablet (781 × 640)' ) )
		.toBeVisible();
} );

it( 'shows Desktop dimensions for a resized canvas and hides status at full width and while zoomed out', async () => {
	await render(
		<RegistryProvider value={ registry }>
			<ViewportStatus />
		</RegistryProvider>
	);
	const status = page.getByText( 'Tablet (781 × 640)' );
	await expect.element( status ).toBeVisible();

	const actions = unlock( registry.dispatch( editorStore ) );
	actions.setCanvasWidth( 1200 );
	await expect.element( status ).not.toBeInTheDocument();
	const desktopStatus = page.getByText( 'Desktop (1200 × 640)' );
	await expect.element( desktopStatus ).toBeVisible();
	actions.setCanvasWidth( undefined );
	await expect.element( desktopStatus ).not.toBeInTheDocument();
	actions.setCanvasWidth( 781 );
	await expect.element( status ).toBeVisible();

	unlock( registry.dispatch( blockEditorStore ) ).setZoomLevel( 50 );
	await expect.element( status ).not.toBeInTheDocument();
	unlock( registry.dispatch( blockEditorStore ) ).resetZoomLevel();
	await expect.element( status ).toBeVisible();
} );
