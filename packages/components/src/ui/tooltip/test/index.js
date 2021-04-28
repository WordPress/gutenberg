/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Text from '../../../text';
import { Tooltip } from '../index';

describe( 'props', () => {
	const baseTooltipId = 'base-tooltip';
	const baseTooltipTriggerContent = 'WordPress.org - Base trigger content';
	const byId = ( id ) => ( t ) => t.id === id;
	beforeEach( () => {
		render(
			<Tooltip baseId={ baseTooltipId } content="Code is Poetry" visible>
				<Text>{ baseTooltipTriggerContent }</Text>
			</Tooltip>
		);
	} );

	test( 'should render correctly', () => {
		const tooltip = screen.getByRole( /tooltip/i );
		expect( tooltip ).toMatchSnapshot();
	} );

	test( 'should render invisible', () => {
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
		const tooltips = screen.getAllByRole( /tooltip/i );
		const invisibleTooltipTrigger = screen.getByText(
			invisibleTooltipTriggerContent
		);
		// The invisible tooltip should not render
		expect( tooltips ).toHaveLength( 1 );
		// Assert that the rendered tooltip is indeed the base tooltip
		expect( tooltips[ 0 ].id ).toBe( baseTooltipId );
		// But the invisible tooltip's trigger still should have rendered
		expect( invisibleTooltipTrigger ).not.toBeUndefined();
	} );

	test( 'should render without children', () => {
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
		const contentlessTooltipId = 'contentless-tooltip';
		render(
			<Tooltip baseId={ contentlessTooltipId } visible>
				<Text>WordPress.org</Text>
			</Tooltip>
		);
		const tooltips = screen.getAllByRole( /tooltip/ );
		// assert only the base tooltip rendered
		expect( tooltips ).toHaveLength( 1 );
		expect( tooltips[ 0 ].id ).toBe( baseTooltipId );
	} );
} );
