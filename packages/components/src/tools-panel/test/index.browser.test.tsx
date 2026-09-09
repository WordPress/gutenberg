import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { ContextSystemProvider } from '../../context';
import { ToolsPanel, ToolsPanelItem } from '..';

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
