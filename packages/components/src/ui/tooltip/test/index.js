/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Text } from '../../../text';
import { Tooltip } from '../index';

describe( 'props', () => {
	const baseTooltipId = 'base-tooltip';
	const baseTooltipTriggerContent = 'WordPress.org - Base trigger content';
	const byId = ( id ) => ( t ) => t.id === id;
	const VisibleTooltip = () => (
		<Tooltip baseId={ baseTooltipId } content="Code is Poetry" visible>
			<Text>{ baseTooltipTriggerContent }</Text>
		</Tooltip>
	);

	test( 'should render correctly', () => {
		render( <VisibleTooltip /> );
		const tooltip = screen.getByRole( /tooltip/i );
		expect( tooltip ).toMatchSnapshot();
	} );

	test( 'should render invisible', () => {
		render( <VisibleTooltip /> );
		const invisibleTooltipTriggerContent = 'WordPress.org - Invisible';
		render(
			<Tooltip
				baseId="test-tooltip"
				content="Code is Poetry"
				visible={ false }
			>
				<Text>{ invisibleTooltipTriggerContent }</Text>
			</Tooltip>
		);
		const tooltip = screen.getByRole( /tooltip/i );
		const invisibleTooltipTrigger = screen.getByText(
			invisibleTooltipTriggerContent
		);
		// The base tooltip should render only; invisible tooltip should not render.
		expect( tooltip ).toBeInTheDocument();
		// Assert that the rendered tooltip is indeed the base tooltip.
		expect( tooltip.id ).toBe( baseTooltipId );
		// But the invisible tooltip's trigger still should have rendered.
		expect( invisibleTooltipTrigger ).not.toBeUndefined();
	} );

	test( 'should render without children', () => {
		render( <VisibleTooltip /> );
		const childlessTooltipId = 'tooltip-without-children';
		render(
			<Tooltip
				baseId={ childlessTooltipId }
				content="Code is Poetry"
				visible
			/>
		);
		const tooltips = screen.getAllByRole( /tooltip/i );
		const childlessTooltip = tooltips.find( byId( childlessTooltipId ) );
		expect( childlessTooltip ).not.toBeUndefined();
	} );

	test( 'should not render a tooltip without content', () => {
		render( <VisibleTooltip /> );
		const contentlessTooltipId = 'contentless-tooltip';
		render(
			<Tooltip baseId={ contentlessTooltipId } visible>
				<Text>WordPress.org</Text>
			</Tooltip>
		);
		const tooltip = screen.getByRole( /tooltip/i );
		// Assert only the base tooltip rendered.
		expect( tooltip ).toBeInTheDocument();
		expect( tooltip.id ).toBe( baseTooltipId );
	} );
} );
