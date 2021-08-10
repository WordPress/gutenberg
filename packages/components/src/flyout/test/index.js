/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { CardBody } from '../../card';
import { Flyout } from '..';

describe( 'props', () => {
	const baseFlyoutId = 'base-flyout';
	beforeEach( () => {
		render(
			<Flyout baseId={ baseFlyoutId } text="WordPress.org" isOpen>
				<CardBody>Code is Poetry</CardBody>
			</Flyout>
		);
	} );

	test( 'should render correctly', () => {
		const dialog = screen.getByRole( 'dialog' );
		expect( dialog.firstChild ).toMatchSnapshot();
	} );

	test( 'should render invisible', () => {
		const invisibleFlyoutTriggerContent =
			'WordPress.org - invisible flyout';
		render(
			<Flyout baseId="flyout" text={ invisibleFlyoutTriggerContent }>
				<CardBody>Code is Poetry</CardBody>
			</Flyout>
		);

		const flyouts = screen.getAllByRole( 'dialog' );
		const trigger = screen.getByText( invisibleFlyoutTriggerContent );
		// assert only the base flyout rendered
		expect( flyouts ).toHaveLength( 1 );
		expect( flyouts[ 0 ].id ).toBe( baseFlyoutId );
		expect( trigger ).not.toBeUndefined();
	} );

	test( 'should render without trigger', () => {
		const triggerlessFlyoutId = 'triggerless-flyout';
		render(
			<Flyout baseId={ triggerlessFlyoutId } isOpen>
				<CardBody>Code is Poetry</CardBody>
			</Flyout>
		);
		const flyouts = screen.getAllByRole( 'dialog' );
		const triggerlessFlyout = flyouts.find(
			( p ) => p.id === triggerlessFlyoutId
		);
		expect( triggerlessFlyout ).not.toBeUndefined();
	} );
} );
