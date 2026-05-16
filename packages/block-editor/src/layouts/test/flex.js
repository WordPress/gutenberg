/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import flex from '../flex';

const FlexLayoutInspectorControls = flex.inspectorControls;
const PANEL_ID = 'test-panel';

function renderInspectorControls( props = {} ) {
	return render(
		<ToolsPanel label="Layout" resetAll={ jest.fn() } panelId={ PANEL_ID }>
			<FlexLayoutInspectorControls
				clientId={ PANEL_ID }
				layout={ {} }
				onChange={ jest.fn() }
				{ ...props }
			/>
		</ToolsPanel>
	);
}

describe( 'getLayoutStyle', () => {
	it( 'should return an empty string if no non-default params are provided', () => {
		const expected = '';

		const result = flex.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
} );

describe( 'FlexLayoutInspectorControls', () => {
	it( 'should not render the wrap toggle by default', () => {
		renderInspectorControls();

		expect(
			screen.queryByRole( 'checkbox', {
				name: 'Allow to wrap to multiple lines',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'should render the wrap toggle when it has a value', () => {
		renderInspectorControls( {
			layout: { flexWrap: 'nowrap' },
		} );

		expect(
			screen.getByRole( 'checkbox', {
				name: 'Allow to wrap to multiple lines',
			} )
		).toBeInTheDocument();
	} );

	it( 'should allow the wrap toggle to be selected from the tools panel menu', async () => {
		const user = userEvent.setup();
		renderInspectorControls( {
			layoutBlockSupport: { allowWrap: true },
		} );

		await user.click(
			screen.getByRole( 'button', { name: /Layout options/i } )
		);
		await user.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Show Wrapping',
			} )
		);

		expect(
			screen.getByRole( 'checkbox', {
				name: 'Allow to wrap to multiple lines',
			} )
		).toBeInTheDocument();
	} );

	it( 'should not include the wrap toggle in the tools panel menu when allowWrap is false', async () => {
		const user = userEvent.setup();
		renderInspectorControls( {
			layoutBlockSupport: { allowWrap: false },
		} );

		await user.click(
			screen.getByRole( 'button', { name: /Layout options/i } )
		);

		expect(
			screen.queryByRole( 'menuitemcheckbox', {
				name: 'Show Wrapping',
			} )
		).not.toBeInTheDocument();
	} );
} );
