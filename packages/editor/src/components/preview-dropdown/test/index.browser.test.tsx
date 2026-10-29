import { beforeEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { SlotFillProvider } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { lock } from '../../../lock-unlock';
import PreviewDropdown from '../';

const setResponsiveEditing = vi.fn();

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useViewportMatch: vi.fn< typeof useViewportMatch >(),
} ) );
vi.mock( import( '@wordpress/data' ), { spy: true } );

beforeEach( () => {
	vi.mocked( useViewportMatch ).mockReturnValue( false );
	vi.mocked( useSelect ).mockReturnValue( {
		deviceType: 'Desktop',
		hasMobileViewport: true,
		hasTabletViewport: true,
		isTemplate: false,
		isViewable: false,
		isResponsiveEditingEnabled: true,
	} );
	const actions = {};
	lock( actions, {
		setDeviceType: vi.fn(),
		resetZoomLevel: vi.fn(),
		setResponsiveEditing,
		setStyleStateViewport: vi.fn(),
	} );
	vi.mocked( useDispatch ).mockReturnValue( actions );
} );

it( 'keeps responsive styles discoverable but prevents activation on Desktop', async () => {
	await render( <Preview disabled={ false } /> );
	await page.getByRole( 'button', { name: 'View', exact: true } ).click();
	const option = page.getByRole( 'menuitemcheckbox', {
		name: 'Responsive styles',
	} );
	await expect.element( option ).toHaveAttribute( 'aria-disabled', 'true' );
	await expect
		.element( option )
		.toHaveAccessibleDescription(
			'Select Tablet or Mobile to style a specific viewport.'
		);
	await userEvent.keyboard( '{Home}{ArrowDown}{ArrowDown}{ArrowDown}' );
	await expect.element( option ).toHaveFocus();
	await userEvent.keyboard( '{Enter} ' );
	expect( setResponsiveEditing ).not.toHaveBeenCalled();
	await expect.element( option ).toHaveAttribute( 'aria-checked', 'false' );
} );

function Preview( { disabled }: { disabled: boolean } ) {
	return (
		<SlotFillProvider>
			<PreviewDropdown disabled={ disabled } />
		</SlotFillProvider>
	);
}

it( 'closes the View menu when it becomes unavailable and keeps its trigger focusable', async () => {
	const screen = await render( <Preview disabled={ false } /> );
	const trigger = page.getByRole( 'button', { name: 'View', exact: true } );
	await userEvent.click( trigger );
	await expect.element( page.getByRole( 'menu' ) ).toBeVisible();

	await screen.rerender( <Preview disabled /> );
	await expect.element( page.getByRole( 'menu' ) ).not.toBeInTheDocument();
	await expect.element( trigger ).toHaveAttribute( 'aria-disabled', 'true' );
	await expect.element( trigger ).toHaveFocus();
	await userEvent.keyboard( '{Enter}{ArrowDown} ' );
	await expect.element( page.getByRole( 'menu' ) ).not.toBeInTheDocument();

	await screen.rerender( <Preview disabled={ false } /> );
	await userEvent.keyboard( '{ArrowDown}' );
	await expect.element( page.getByRole( 'menu' ) ).toBeVisible();
	await userEvent.keyboard( '{Escape}' );
	await expect.element( page.getByRole( 'menu' ) ).not.toBeInTheDocument();
} );

it( 'shows the responsive editing cue only on viewport-specific breakpoints', async () => {
	const selection = {
		deviceType: 'Tablet',
		hasMobileViewport: true,
		hasTabletViewport: true,
		isResponsiveEditing: true,
		isResponsiveEditingEnabled: true,
	};
	vi.mocked( useSelect ).mockReturnValue( selection );
	const screen = await render( <Preview disabled={ false } /> );
	const trigger = page.getByRole( 'button', { name: 'View', exact: true } );
	await expect.element( trigger ).toHaveClass( 'is-responsive-editing' );

	vi.mocked( useSelect ).mockReturnValue( {
		...selection,
		deviceType: 'Desktop',
	} );
	await screen.rerender( <Preview disabled={ false } /> );
	await expect.element( trigger ).not.toHaveClass( 'is-responsive-editing' );

	vi.mocked( useSelect ).mockReturnValue( selection );
	await screen.rerender( <Preview disabled={ false } /> );
	await expect.element( trigger ).toHaveClass( 'is-responsive-editing' );
} );
