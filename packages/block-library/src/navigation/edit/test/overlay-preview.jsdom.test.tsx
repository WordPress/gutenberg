import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ComponentType, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import type { BlockPreview as RealBlockPreview } from '@wordpress/block-editor';
import type { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

// Renders whether the preview's blocks are inside the overlay preview context.
vi.mock( import( '@wordpress/block-editor' ), async () => {
	const { useContext } = await import( '@wordpress/element' );
	const { default: OverlayPreviewContext } =
		await import( '../overlay-preview-context' );
	function BlockPreview() {
		return (
			<p>
				{ useContext( OverlayPreviewContext )
					? 'In overlay preview'
					: 'Not in overlay preview' }
			</p>
		);
	}
	BlockPreview.Async = ( { children }: { children: ReactNode } ) => children;
	return {
		BlockPreview: BlockPreview as unknown as typeof RealBlockPreview,
	};
} );

// Keeps the component light to load.
vi.mock( import( '@wordpress/components' ), () => ( {
	Spinner: ( () =>
		null ) as unknown as typeof import( '@wordpress/components' ).Spinner,
} ) );

vi.mock( import( '@wordpress/blocks' ), () => ( {
	parse: vi.fn( () => [] ),
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( {
	store: {} as typeof coreStore,
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

// Loaded in `beforeAll`, since the build project only lists TypeScript files.
let OverlayPreview: ComponentType< { overlay: string; currentTheme: string } >;

describe( 'OverlayPreview', () => {
	beforeAll( async () => {
		const { default: Preview } = await vi.importActual< {
			default: typeof OverlayPreview;
		} >( '../overlay-preview' );
		OverlayPreview = Preview;
	} );

	it( 'tells the previewed blocks that they are inside an overlay', () => {
		vi.mocked( useSelect ).mockReturnValue( {
			content: '',
			editedBlocks: [],
			hasResolved: true,
		} );
		render(
			<OverlayPreview overlay="my-overlay" currentTheme="my-theme" />
		);

		expect( screen.getByText( 'In overlay preview' ) ).toBeVisible();
	} );
} );
