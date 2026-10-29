import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { plus } from '@wordpress/icons';
import '@wordpress/theme/design-tokens.css';
import '../style.scss';
import '../../toolbar/toolbar/style.scss';
import '../../toolbar/toolbar-group/style.scss';
import '../../toolbar/toolbar-button/style.scss';
import Button from '..';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../../toolbar';

const variants = [ 'primary', 'secondary', 'tertiary' ] as const;

function expectBusyPresentation( button: HTMLElement ) {
	const spinner = screen.getByTestId( 'components-button-busy-spinner' );
	const style = getComputedStyle( button );
	expect( style.webkitTextFillColor ).toBe( 'rgba(0, 0, 0, 0)' );
	expect( style.backgroundImage ).toBe( 'none' );
	expect( getComputedStyle( spinner ).color ).toBe( style.color );
	expect( getComputedStyle( spinner ).opacity ).toBe( '1' );
	expect( getComputedStyle( spinner ).position ).toBe( 'absolute' );
	expect( spinner.getBoundingClientRect().width ).toBe(
		parseFloat( style.fontSize )
	);
	expect( spinner.getBoundingClientRect().height ).toBe(
		parseFloat( style.fontSize )
	);
}

describe( 'Button busy presentation', () => {
	it( 'keeps consumer-supplied positioning while busy', async () => {
		await render(
			<>
				<style>
					{
						'.busy-positioned-button { position: absolute; top: 12px; left: 16px; }'
					}
				</style>
				<Button
					__next40pxDefaultSize
					className="busy-positioned-button"
					isBusy
				>
					Saving
				</Button>
			</>
		);
		const button = screen.getByRole( 'button', { name: 'Saving' } );
		expect( getComputedStyle( button ).position ).toBe( 'absolute' );
		expectBusyPresentation( button );
	} );

	it( 'keeps the spinner size inside a toolbar group', async () => {
		await render(
			<Toolbar label="Formatting">
				<ToolbarGroup>
					<ToolbarButton icon={ plus } title="Add" isBusy />
				</ToolbarGroup>
			</Toolbar>
		);
		const button = screen.getByRole( 'button', { name: 'Add' } );
		expect( button ).toBeVisible();
		expectBusyPresentation( button );
	} );

	it( 'keeps the spinner size on a legacy subscript toolbar button', async () => {
		await render(
			<ToolbarButton
				icon={ plus }
				title="Add"
				data-subscript="1"
				isBusy
			/>
		);
		const button = screen.getByRole( 'button', { name: 'Add' } );
		expect( button ).toBeVisible();
		expectBusyPresentation( button );
	} );

	it.each( variants )(
		'keeps the %s label hidden and spinner visible during hover and keyboard activation',
		async ( variant ) => {
			const onClick = vi.fn();
			await render(
				<Button
					__next40pxDefaultSize
					variant={ variant }
					isBusy
					onClick={ onClick }
				>
					Saving
				</Button>
			);
			const button = screen.getByRole( 'button', { name: 'Saving' } );
			await userEvent.hover( button );
			expectBusyPresentation( button );
			await userEvent.unhover( button );
			await userEvent.tab();
			await userEvent.keyboard( '[Space>]' );
			expectBusyPresentation( button );
			await userEvent.keyboard( '[/Space]' );
			expect( onClick ).toHaveBeenCalledOnce();
			expect( button ).toBeEnabled();
		}
	);

	it.each( variants )(
		'keeps the spinner visible for a pressed disabled busy %s button',
		async ( variant ) => {
			await render(
				<Button
					__next40pxDefaultSize
					variant={ variant }
					aria-pressed
					isBusy
					disabled
				>
					Saving
				</Button>
			);
			const button = screen.getByRole( 'button', { name: 'Saving' } );
			expect( button ).toBeDisabled();
			expectBusyPresentation( button );
		}
	);

	it( 'keeps the button dimensions when its content is replaced by the spinner', async () => {
		const { rerender } = await render(
			<Button __next40pxDefaultSize icon={ plus }>
				<span>Saving</span>
			</Button>
		);
		const before = screen
			.getByRole( 'button', { name: 'Saving' } )
			.getBoundingClientRect();
		await rerender(
			<Button __next40pxDefaultSize icon={ plus } isBusy>
				<span>Saving</span>
			</Button>
		);
		const button = screen.getByRole( 'button', { name: 'Saving' } );
		const after = button.getBoundingClientRect();
		expect( [ after.width, after.height ] ).toEqual( [
			before.width,
			before.height,
		] );
		expect( getComputedStyle( screen.getByText( 'Saving' ) ).opacity ).toBe(
			'0'
		);
		expectBusyPresentation( button );
	} );

	it( 'uses a consumer-supplied color for the spinner', async () => {
		await render(
			<Button
				__next40pxDefaultSize
				isBusy
				style={ { color: 'rebeccapurple' } }
			>
				Saving
			</Button>
		);
		const button = screen.getByRole( 'button', { name: 'Saving' } );
		expect( getComputedStyle( button ).color ).toBe( 'rgb(102, 51, 153)' );
		expectBusyPresentation( button );
	} );

	it( 'centers the spinner in a toolbar button', async () => {
		await render(
			<Toolbar label="Formatting">
				<ToolbarButton icon={ plus } title="Add" isBusy />
			</Toolbar>
		);
		const button = screen.getByRole( 'button', { name: 'Add' } );
		expect( button ).toBeVisible();
		expectBusyPresentation( button );
	} );
} );
