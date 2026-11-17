import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import {
	useSettings,
	type store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	useEntityRecords,
	type store as coreStore,
} from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import type { store as noticesStore } from '@wordpress/notices';
import { Status } from '../../../../../core-data/src/hooks/constants';
import type { OverlayViewportMap } from '../../overlay-viewports';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

vi.mock( import( '@wordpress/block-editor' ), () => ( {
	useSettings: vi.fn(),
	store: {} as typeof blockEditorStore,
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( {
	useEntityRecords: vi.fn(),
	store: {} as typeof coreStore,
} ) );

// Only used when creating an overlay. Mocked to keep the panel light to load.
vi.mock( import( '@wordpress/blocks' ), () => ( {
	parse: vi.fn(),
	serialize: vi.fn(),
	createBlock: vi.fn(),
} ) );

vi.mock( import( '@wordpress/notices' ), () => ( {
	store: {} as typeof noticesStore,
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
	useDispatch: vi.fn(),
} ) );

// Loaded in `beforeAll`, since the build project only lists TypeScript files.
let OverlayPanel: ComponentType< {
	overlayMenu: string;
	overlayViewports: OverlayViewportMap | null;
	setAttributes: () => void;
	setOverlayMenuPreview: () => void;
	isResponsive: boolean;
} >;

const NEVER = { mobile: false, tablet: false, desktop: false };
const TABLET = { mobile: true, tablet: true, desktop: false };

async function renderPanel(
	overlayMenu: string,
	overlayViewports: OverlayViewportMap | null
) {
	render(
		<OverlayPanel
			overlayMenu={ overlayMenu }
			overlayViewports={ overlayViewports }
			setAttributes={ vi.fn() }
			setOverlayMenuPreview={ vi.fn() }
			isResponsive={ overlayViewports !== NEVER }
		/>
	);
	// Let the Overlay Visibility control settle.
	await screen.findAllByRole( 'radio' );
}

describe( 'OverlayPanel', () => {
	// Loading the component and its dependencies can take several seconds.
	beforeAll( async () => {
		const { default: Panel } = await vi.importActual< {
			default: typeof OverlayPanel;
		} >( '../overlay-panel' );
		OverlayPanel = Panel;
	}, 30000 );

	beforeEach( () => {
		vi.mocked( useSettings ).mockReturnValue( [ undefined ] );
		vi.mocked( useEntityRecords ).mockReturnValue( {
			records: [],
			isResolving: false,
			hasResolved: true,
			hasStarted: true,
			status: Status.Success,
			totalItems: 0,
			totalPages: 0,
		} );
		vi.mocked( useSelect ).mockReturnValue( undefined );
		vi.mocked( useDispatch ).mockReturnValue( {} );
	} );

	it( 'shows the overlay settings when a filter shows the overlay for a block set to never', async () => {
		await renderPanel( 'never', TABLET );

		expect(
			screen.getByRole( 'heading', { name: 'Overlay template' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Overlay menu controls' } )
		).toBeVisible();
	} );

	it( 'shows the overlay settings when a filter hides the overlay for a block that shows it', async () => {
		await renderPanel( 'tablet', NEVER );

		expect(
			screen.getByRole( 'heading', { name: 'Overlay template' } )
		).toBeVisible();
	} );

	it( 'hides the overlay settings when neither the setting nor the filter shows the overlay', async () => {
		await renderPanel( 'never', NEVER );

		expect(
			screen.queryByRole( 'heading', { name: 'Overlay template' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Overlay menu controls' } )
		).not.toBeInTheDocument();
	} );
} );
