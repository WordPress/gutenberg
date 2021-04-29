/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Button from '../../../button';
import { CardBody } from '../../card';
import { Popover } from '../index';

describe( 'props', () => {
	const basePopoverId = 'base-popover';
	beforeEach( () => {
		render(
			<Popover
				baseId={ basePopoverId }
				trigger={ <Button>WordPress.org</Button> }
				visible
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
	} );

	test( 'should render correctly', () => {
		const dialog = screen.getByRole( 'dialog' );
		expect( dialog.firstChild ).toMatchSnapshot();
	} );

	test( 'should render invisible', () => {
		const invisiblePopoverTriggerContent =
			'WordPress.org - invisible popover';
		render(
			<Popover
				baseId="popover"
				trigger={ <Button>{ invisiblePopoverTriggerContent }</Button> }
				visible={ false }
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);

		const popovers = screen.getAllByRole( 'dialog' );
		const trigger = screen.getByText( invisiblePopoverTriggerContent );
		// assert only the base popover rendered
		expect( popovers ).toHaveLength( 1 );
		expect( popovers[ 0 ].id ).toBe( basePopoverId );
		expect( trigger ).not.toBeUndefined();
	} );

	test( 'should render without trigger', () => {
		const triggerlessPopoverId = 'triggerless-popover';
		render(
			<Popover baseId={ triggerlessPopoverId } visible>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		const popovers = screen.getAllByRole( 'dialog' );
		const triggerlessPopover = popovers.find(
			( p ) => p.id === triggerlessPopoverId
		);
		expect( triggerlessPopover ).not.toBeUndefined();
	} );

	test( 'should render without content', () => {
		const contentlessPopoverId = 'contentless-popover';
		render(
			<Popover
				baseId={ contentlessPopoverId }
				trigger={ <Button>WordPress.org</Button> }
				visible
			/>
		);
		const popovers = screen.getAllByRole( 'dialog' );
		const contentlessPopover = popovers.find(
			( p ) => p.id === contentlessPopoverId
		);
		const basePopover = popovers.find( ( p ) => p.id === basePopoverId );
		expect( contentlessPopover ).toMatchDiffSnapshot( basePopover );
	} );

	test( 'should render label', () => {
		const labelledPopoverId = 'labelled-popover';
		render(
			<Popover
				baseId={ labelledPopoverId }
				label="show"
				trigger={ <Button>WordPress.org</Button> }
				visible
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		const popovers = screen.getAllByRole( 'dialog' );
		const labelledPopover = popovers.find(
			( p ) => p.id === labelledPopoverId
		);
		const basePopover = popovers.find( ( p ) => p.id === basePopoverId );
		expect( labelledPopover ).toMatchDiffSnapshot( basePopover );
	} );
} );
