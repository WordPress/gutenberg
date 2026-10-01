import { beforeEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { SlotFillProvider } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { lock } from '../../../lock-unlock';
import PreviewDropdown from '../';

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
	} );
	vi.mocked( useDispatch ).mockReturnValue( actions );
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
