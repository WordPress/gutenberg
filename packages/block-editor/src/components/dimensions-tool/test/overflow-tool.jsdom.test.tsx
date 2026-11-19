import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import OverflowTool from '../overflow-tool';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

describe( 'OverflowTool', () => {
	it( 'renders the overflow options correctly', () => {
		render(
			<ToolsPanel
				label="Dimensions"
				panelId="test-panel"
				resetAll={ () => {} }
			>
				<OverflowTool
					panelId="test-panel"
					value="clip"
					onChange={ () => {} }
					isShownByDefault
				/>
			</ToolsPanel>
		);

		const visibleBtn = screen.getByRole( 'button', { name: 'Visible' } );
		const clipBtn = screen.getByRole( 'button', { name: 'Clip' } );
		const hiddenBtn = screen.getByRole( 'button', { name: 'Hidden' } );

		expect( visibleBtn ).toBeInTheDocument();
		expect( clipBtn ).toBeInTheDocument();
		expect( hiddenBtn ).toBeInTheDocument();

		expect( clipBtn ).toHaveAttribute( 'aria-pressed', 'true' );
		expect( visibleBtn ).toHaveAttribute( 'aria-pressed', 'false' );
		expect( hiddenBtn ).toHaveAttribute( 'aria-pressed', 'false' );
	} );

	it( 'calls onChange when an option is selected', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		render(
			<ToolsPanel
				label="Dimensions"
				panelId="test-panel"
				resetAll={ () => {} }
			>
				<OverflowTool
					panelId="test-panel"
					value={ undefined }
					onChange={ onChange }
					isShownByDefault
				/>
			</ToolsPanel>
		);

		const clipBtn = screen.getByRole( 'button', { name: 'Clip' } );
		await user.click( clipBtn );

		expect( onChange ).toHaveBeenCalledWith( 'clip' );
	} );

	it( 'calls onChange with undefined when active option is clicked to deselect', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		render(
			<ToolsPanel
				label="Dimensions"
				panelId="test-panel"
				resetAll={ () => {} }
			>
				<OverflowTool
					panelId="test-panel"
					value="clip"
					onChange={ onChange }
					isShownByDefault
				/>
			</ToolsPanel>
		);

		const clipBtn = screen.getByRole( 'button', { name: 'Clip' } );
		await user.click( clipBtn );

		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );
} );
