import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import type { ReactNode } from 'react';
import { lock } from '../../../lock-unlock';
import StylesCanvas from '../';
import StyleBook from '../../style-book';
import '../style.scss';
import '../../style-book/style.scss';

const revisionState = vi.hoisted( () => ( { isLoading: false } ) );

vi.mock( import( '@wordpress/data' ), { spy: true } );
vi.mock( import( '../../resizable-editor' ), () => ( {
	default: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );
vi.mock( import( '../../global-styles' ), () => ( {
	useStyle: () => undefined,
	useGlobalStyles: () => ( { base: {}, user: {} } ),
} ) );
vi.mock( import( '../../global-styles/hooks' ), () => ( {
	useGlobalStyles: () => ( { base: {}, user: {} } ),
} ) );
vi.mock( import( '../../../hooks/use-global-styles-output' ), () => ( {
	useGlobalStylesOutputWithConfig: () => [ [] ],
} ) );
vi.mock( import( '../../global-styles-renderer' ), () => ( {
	GlobalStylesRenderer: () => null,
} ) );
vi.mock( import( '@wordpress/global-styles-ui' ), () => ( {
	useGlobalStylesRevisions: () => ( {
		revisions: [ { id: 123 } ],
		isLoading: revisionState.isLoading,
		hasUnsavedChanges: false,
		revisionsCount: 1,
	} ),
} ) );
vi.mock( import( '../../style-book/examples' ), () => ( {
	getExamples: () => [
		{ name: 'typography', title: 'Typography', category: 'overview' },
		{ name: 'core/paragraph', title: 'Paragraph', category: 'text' },
		{ name: 'core/image', title: 'Image', category: 'media' },
	],
} ) );
vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const { forwardRef } = await import( '@wordpress/element' );
	return {
		...( await importOriginal() ),
		useSettings: () => [],
		__experimentalUseMultipleOriginColorsAndGradients: () => ( {
			colors: [],
			gradients: [],
			disableCustomColors: false,
			disableCustomGradients: false,
			hasColorsOrGradients: false,
		} ),
		// Keep an actual frame as the focus boundary, without rendering block previews.
		__unstableIframe: forwardRef< HTMLIFrameElement, { name?: string } >(
			( { name }, ref ) => (
				<iframe
					ref={ ref }
					title={ name }
					srcDoc="<button>Preview example</button>"
				/>
			)
		),
	};
} );

const resetStylesNavigation = vi.fn();
const setIsListViewOpened = vi.fn();
const selection = {
	stylesPath: '/',
	showStylebook: true,
	showListViewByDefault: true,
	isPreviewMode: false,
	styles: [],
};

beforeEach( () => {
	revisionState.isLoading = false;
	vi.mocked( useSelect ).mockReturnValue( selection );
	const actions = { setIsListViewOpened };
	lock( actions, {
		resetStylesNavigation,
		setStylesPath: vi.fn(),
	} );
	vi.mocked( useDispatch ).mockReturnValue( actions );
} );

function CanvasFixture( { showCanvas = true } = {} ) {
	const [ opened, setOpened ] = useState( false );
	resetStylesNavigation.mockImplementation( () => setOpened( false ) );
	return (
		<>
			<button onClick={ () => setOpened( true ) }>Open Style Book</button>
			<div style={ { height: 500, position: 'relative' } }>
				{ opened && showCanvas && <StylesCanvas /> }
			</div>
			<button>Outside canvas</button>
		</>
	);
}

describe( 'Style Book focus order', () => {
	it.each( [ '/', '/blocks/core%2Fparagraph', '/revisions/123' ] )(
		'focuses the selected tab, then Close, then the preview at %s',
		async ( stylesPath ) => {
			vi.mocked( useSelect ).mockReturnValue( {
				...selection,
				stylesPath,
			} );
			await render( <CanvasFixture /> );
			await page
				.getByRole( 'button', { name: 'Open Style Book' } )
				.click();
			const selectedTab = page.getByRole( 'tab', { selected: true } );
			const close = page.getByRole( 'button', {
				name: 'Close',
				exact: true,
			} );
			await expect.element( selectedTab ).toHaveFocus();
			await userEvent.tab();
			await expect.element( close ).toHaveFocus();
			await userEvent.tab();
			await expect
				.element( page.getByTitle( 'style-book-canvas' ) )
				.toHaveFocus();
		}
	);

	it( 'keeps reverse navigation, Escape and focus return working', async () => {
		await render( <CanvasFixture /> );
		const opener = page.getByRole( 'button', { name: 'Open Style Book' } );
		await opener.click();
		const selectedTab = page.getByRole( 'tab', { selected: true } );
		await expect.element( selectedTab ).toHaveFocus();
		await userEvent.tab();
		await userEvent.tab( { shift: true } );
		await expect.element( selectedTab ).toHaveFocus();
		await userEvent.keyboard( '{Escape}' );
		expect( setIsListViewOpened ).toHaveBeenCalledWith( true );
		expect( resetStylesNavigation ).toHaveBeenCalledOnce();
		await expect.element( opener ).toHaveFocus();
	} );

	it( 'keeps the Close button before a revisions-only preview', async () => {
		vi.mocked( useSelect ).mockReturnValue( {
			...selection,
			showStylebook: false,
			stylesPath: '/revisions/123',
		} );
		await render( <CanvasFixture /> );
		await page.getByRole( 'button', { name: 'Open Style Book' } ).click();
		await expect
			.element(
				page.getByRole( 'button', { name: 'Close', exact: true } )
			)
			.toHaveFocus();
		await userEvent.tab();
		await expect.element( page.getByTitle( 'revisions' ) ).toHaveFocus();
	} );

	it( 'keeps Close available while a Style Book revision is loading', async () => {
		revisionState.isLoading = true;
		vi.mocked( useSelect ).mockReturnValue( {
			...selection,
			stylesPath: '/revisions/123',
		} );
		await render( <CanvasFixture /> );
		const opener = page.getByRole( 'button', { name: 'Open Style Book' } );
		await opener.click();
		await page
			.getByRole( 'button', { name: 'Close', exact: true } )
			.click();
		expect( resetStylesNavigation ).toHaveBeenCalledOnce();
	} );

	it.each( [ false, true ] )(
		'preserves focus when a revision finishes loading (focus moved: %s)',
		async ( moveFocus ) => {
			revisionState.isLoading = true;
			vi.mocked( useSelect ).mockReturnValue( {
				...selection,
				stylesPath: '/revisions/123',
			} );
			const screen = await render( <CanvasFixture /> );
			const opener = page.getByRole( 'button', {
				name: 'Open Style Book',
			} );
			const close = page.getByRole( 'button', {
				name: 'Close',
				exact: true,
			} );
			await opener.click();
			await expect.element( close ).toHaveFocus();
			if ( moveFocus ) {
				await opener.click();
			}
			revisionState.isLoading = false;
			await screen.rerender( <CanvasFixture /> );
			await expect
				.element( page.getByRole( 'tab', { selected: true } ) )
				.toBeVisible();
			await expect.element( moveFocus ? opener : close ).toHaveFocus();
			if ( moveFocus ) {
				await close.click();
			} else {
				await userEvent.keyboard( '{Escape}' );
			}
			await expect.element( opener ).toHaveFocus();
		}
	);

	it( 'does not add Close or Escape handling to a preview canvas', async () => {
		vi.mocked( useSelect ).mockReturnValue( {
			...selection,
			isPreviewMode: true,
		} );
		await render( <CanvasFixture /> );
		await page.getByRole( 'button', { name: 'Open Style Book' } ).click();
		await expect
			.element(
				page.getByRole( 'button', { name: 'Close', exact: true } )
			)
			.not.toBeInTheDocument();
		await page.getByRole( 'tab', { selected: true } ).click();
		await userEvent.keyboard( '{Escape}' );
		expect( resetStylesNavigation ).not.toHaveBeenCalled();
	} );

	it.each( [ false, true ] )(
		'preserves preview focus return without stealing focus (focus moved: %s)',
		async ( moveFocus ) => {
			vi.mocked( useSelect ).mockReturnValue( {
				...selection,
				isPreviewMode: true,
			} );
			const screen = await render( <CanvasFixture /> );
			const opener = page.getByRole( 'button', {
				name: 'Open Style Book',
			} );
			const outside = page.getByRole( 'button', {
				name: 'Outside canvas',
			} );
			await opener.click();
			await expect.element( opener ).toHaveFocus();
			await page.getByRole( 'tab', { selected: true } ).click();
			if ( moveFocus ) {
				await outside.click();
			}
			await screen.rerender( <CanvasFixture showCanvas={ false } /> );
			await expect.element( moveFocus ? outside : opener ).toHaveFocus();
		}
	);

	it( 'retains a supplied action when tabs are hidden', async () => {
		await render(
			<StyleBook
				showTabs={ false }
				isSelected={ undefined }
				onSelect={ undefined }
				onClick={ undefined }
				headerActions={ <button>Close Style Book</button> }
			/>
		);
		await userEvent.tab();
		await expect
			.element( page.getByRole( 'button', { name: 'Close Style Book' } ) )
			.toHaveFocus();
		await userEvent.tab();
		await expect
			.element( page.getByTitle( 'style-book-canvas' ) )
			.toHaveFocus();
	} );
} );
