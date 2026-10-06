import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';
import { lock } from '../../../lock-unlock';
import EditorInterface from '../';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );
vi.mock( import( '@wordpress/data' ), { spy: true } );
vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useViewportMatch: vi.fn(),
} ) );
vi.mock( import( '@wordpress/interface' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	InterfaceSkeleton: ( { footer } ) => footer && <footer>{ footer }</footer>,
	ComplementaryArea: { Slot: () => null },
} ) );
vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	BlockBreadcrumb: () => <span>Breadcrumbs</span>,
} ) );
vi.mock( import( '../../viewport-status' ), () => ( {
	default: () => <span>Viewport status</span>,
} ) );
vi.mock(
	import( '../../collaborators-presence/use-collaborator-notifications' ),
	() => ( {
		useCollaboratorNotifications: () => {},
	} )
);

beforeEach( () => {
	vi.mocked( useViewportMatch ).mockReturnValue( true );
	const actions = { setIsListViewOpened: vi.fn() };
	lock( actions, { setShowRevisionDiff: vi.fn() } );
	vi.mocked( useDispatch ).mockReturnValue( actions );
} );

it.each( [
	[ true, 781 ],
	[ false, 781 ],
	[ true, undefined ],
	[ false, undefined ],
] )(
	'shows or hides the entire footer with the breadcrumb preference %s and canvas width %s',
	( showBlockBreadcrumbs, canvasWidth ) => {
		const editorSelectors = {
			getEditorSettings: () => ( { richEditingEnabled: true } ),
			getEditorMode: () => 'visual',
			getPostTypeLabel: () => 'Post',
			getCurrentPostType: () => 'post',
			getCurrentPostId: () => 1,
			isInserterOpened: () => false,
			isListViewOpened: () => false,
		};
		lock( editorSelectors, {
			getStylesPath: () => '/',
			getShowStylebook: () => false,
			isRevisionsMode: () => false,
			isShowingRevisionDiff: () => false,
			getCanvasWidth: () => canvasWidth,
		} );
		vi.mocked( useSelect ).mockImplementation( ( mapSelect ) =>
			mapSelect( ( store ) =>
				store === preferencesStore
					? {
							get: ( scope, name ) =>
								( {
									showBlockBreadcrumbs,
								} )[ name ],
						}
					: editorSelectors
			)
		);
		const hasViewportStatus =
			showBlockBreadcrumbs && canvasWidth !== undefined;
		render( <EditorInterface /> );
		expect( !! screen.queryByText( 'Breadcrumbs' ) ).toBe(
			showBlockBreadcrumbs
		);
		expect( !! screen.queryByText( 'Viewport status' ) ).toBe(
			hasViewportStatus
		);
		expect( !! screen.queryByRole( 'contentinfo' ) ).toBe(
			showBlockBreadcrumbs
		);
	}
);
