import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import { ContextSystemProvider } from '../../context';
import { ToolsPanel, ToolsPanelItem } from '..';
// The cascade contract includes Button's global icon-button defaults.
import '../../button/style.scss';
import '../../style.scss';

const defaultProps = {
	label: 'Panel header',
	resetAll: vi.fn(),
};

const controlProps = {
	hasValue: () => true,
	label: 'Example',
	onDeselect: vi.fn(),
	onSelect: vi.fn(),
	onShownChange: vi.fn(),
};

const hiddenControlProps = {
	...controlProps,
	hasValue: () => false,
	label: 'Hidden example',
};

describe( 'ToolsPanel styles', () => {
	it( 'keeps ToolsPanel labels aligned when an option is shown or hidden', async () => {
		const user = userEvent.setup();
		await render(
			<ToolsPanel { ...defaultProps }>
				<ToolsPanelItem { ...controlProps }>Control</ToolsPanelItem>
				<ToolsPanelItem { ...hiddenControlProps }>
					Hidden control
				</ToolsPanelItem>
			</ToolsPanel>
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Panel header options' } )
		);

		const menu = screen.getByRole( 'menu' );
		const shown = screen.getByRole( 'menuitemcheckbox', {
			name: /^Example,/,
		} );
		const hidden = screen.getByRole( 'menuitemcheckbox', {
			name: /^Hidden example,/,
		} );
		const shownLabel = screen.getByText( 'Example' );
		const hiddenLabel = screen.getByText( 'Hidden example' );
		const labelLeft = shownLabel.getBoundingClientRect().left;
		const initialWidth = menu.getBoundingClientRect().width;
		// The decorative selection mark has no accessible role to query.
		// eslint-disable-next-line testing-library/no-node-access
		const shownIcon = shown.querySelector( 'svg' )!;

		expect( hiddenLabel.getBoundingClientRect().left ).toBe( labelLeft );
		expect(
			shownIcon.getBoundingClientRect().left -
				menu.getBoundingClientRect().left
		).toBe( 7 );
		expect( shownIcon.getBoundingClientRect().right ).toBeLessThanOrEqual(
			labelLeft
		);
		for ( const checked of [ 'true', 'false' ] ) {
			await user.click( hidden );
			await expect
				.element( hidden )
				.toHaveAttribute( 'aria-checked', checked );
			expect( shownLabel.getBoundingClientRect().left ).toBe( labelLeft );
			expect( hiddenLabel.getBoundingClientRect().left ).toBe(
				labelLeft
			);
			expect( menu.getBoundingClientRect().width ).toBe( initialWidth );
		}
	} );

	it( 'applies the panel padding and border', async () => {
		await render(
			<ToolsPanel { ...defaultProps } data-testid="tools-panel">
				<ToolsPanelItem { ...controlProps }>Control</ToolsPanelItem>
			</ToolsPanel>
		);

		const styles = getComputedStyle( screen.getByTestId( 'tools-panel' ) );
		expect( styles.padding ).toBe( '16px' );
		expect( styles.borderTopWidth ).toBe( '1px' );
		expect( styles.borderTopStyle ).toBe( 'solid' );
	} );

	it( 'preserves row and column gaps against Grid context values', async () => {
		await render(
			<ContextSystemProvider
				value={ { Grid: { columnGap: '40px', rowGap: '48px' } } }
			>
				<ToolsPanel { ...defaultProps } data-testid="tools-panel">
					<span>Panel content</span>
				</ToolsPanel>
			</ContextSystemProvider>
		);

		const styles = getComputedStyle( screen.getByTestId( 'tools-panel' ) );
		expect( styles.columnGap ).toBe( '16px' );
		expect( styles.rowGap ).toBe( '16px' );
	} );

	it( 'hides placeholder items and the inner wrapper when configured', async () => {
		await render(
			<ToolsPanel
				{ ...defaultProps }
				hasInnerWrapper
				shouldRenderPlaceholderItems
			>
				<div data-testid="inner-wrapper">
					<ToolsPanelItem
						{ ...hiddenControlProps }
						data-testid="placeholder"
					>
						Hidden control
					</ToolsPanelItem>
				</div>
			</ToolsPanel>
		);

		expect(
			getComputedStyle( await screen.findByTestId( 'inner-wrapper' ) )
				.display
		).toBe( 'none' );
		expect(
			getComputedStyle( await screen.findByTestId( 'placeholder' ) )
				.display
		).toBe( 'none' );
	} );

	it( 'keeps the dropdown toggle override above its base styles', async () => {
		await render(
			<ToolsPanel { ...defaultProps }>
				<ToolsPanelItem { ...controlProps }>Control</ToolsPanelItem>
			</ToolsPanel>
		);

		const toggle = await screen.findByRole( 'button', {
			name: 'Panel header options',
		} );
		const styles = getComputedStyle( toggle );
		expect( styles.padding ).toBe( '0px' );
		expect( styles.minWidth ).toBe( '24px' );
	} );
} );
