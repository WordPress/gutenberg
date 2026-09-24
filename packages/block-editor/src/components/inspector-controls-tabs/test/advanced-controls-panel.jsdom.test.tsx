import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import AdvancedControls from '../advanced-controls-panel';
import groups from '../../inspector-controls/groups';

// The `InspectorControls` fill component is bypassed in favour of the
// underlying group fills, so that the panel can be exercised without a
// selected block and its editing mode.
const AdvancedFill = groups.advanced.Fill;
const AdvancedStylesFill = groups[ 'advanced-styles' ].Fill;

type PanelProps = {
	showSettingsControls?: boolean;
	showStylesControls?: boolean;
};

/**
 * Renders the Advanced panel with a fill in each of the two advanced groups.
 *
 * @param props Props forwarded to the panel.
 */
function renderPanel( props: PanelProps = {} ) {
	render(
		<SlotFillProvider>
			<AdvancedFill>
				<span>HTML anchor</span>
			</AdvancedFill>
			<AdvancedStylesFill>
				<span>Additional CSS</span>
			</AdvancedStylesFill>
			<AdvancedControls initialOpen { ...props } />
		</SlotFillProvider>
	);
}

describe( 'AdvancedControls', () => {
	it( 'renders nothing when no group has fills', () => {
		render(
			<SlotFillProvider>
				<AdvancedControls initialOpen showStylesControls />
			</SlotFillProvider>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Advanced' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders only the settings tools by default', () => {
		renderPanel();

		expect(
			screen.getByRole( 'button', { name: 'Advanced' } )
		).toBeVisible();
		expect( screen.getByText( 'HTML anchor' ) ).toBeVisible();
		expect(
			screen.queryByText( 'Additional CSS' )
		).not.toBeInTheDocument();
	} );

	it( 'renders only the styling tools for the styles tab', () => {
		renderPanel( {
			showSettingsControls: false,
			showStylesControls: true,
		} );

		expect( screen.getByText( 'Additional CSS' ) ).toBeVisible();
		expect( screen.queryByText( 'HTML anchor' ) ).not.toBeInTheDocument();
	} );

	it( 'combines both groups into a single panel when both are enabled', () => {
		renderPanel( { showStylesControls: true } );

		expect(
			screen.getAllByRole( 'button', { name: 'Advanced' } )
		).toHaveLength( 1 );
		expect( screen.getByText( 'HTML anchor' ) ).toBeVisible();
		expect( screen.getByText( 'Additional CSS' ) ).toBeVisible();
	} );

	it( 'renders nothing when the only fills belong to a disabled group', () => {
		render(
			<SlotFillProvider>
				<AdvancedStylesFill>
					<span>Additional CSS</span>
				</AdvancedStylesFill>
				<AdvancedControls initialOpen />
			</SlotFillProvider>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Advanced' } )
		).not.toBeInTheDocument();
	} );
} );
