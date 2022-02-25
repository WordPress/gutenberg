/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { CardBody } from '../../card';
import { Flyout } from '..';

describe( 'props', () => {
	const baseFlyoutId = 'base-flyout';
	beforeEach( () => {
		render(
			<Flyout
				baseId={ baseFlyoutId }
				trigger={ <Button>WordPress.org</Button> }
				visible
			>
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
			<Flyout
				baseId="flyout"
				trigger={ <Button>{ invisibleFlyoutTriggerContent }</Button> }
				visible={ false }
			>
				<CardBody>Code is Poetry</CardBody>
			</Flyout>
		);

		const flyouts = screen.getAllByRole( 'dialog' );
		const trigger = screen.getByText( invisibleFlyoutTriggerContent );
		// Assert only the base flyout rendered.
		expect( flyouts ).toHaveLength( 1 );
		expect( flyouts[ 0 ].id ).toBe( baseFlyoutId );
		expect( trigger ).not.toBeUndefined();
	} );

	test( 'should render without trigger', () => {
		const triggerlessFlyoutId = 'triggerless-flyout';
		render(
			<Flyout baseId={ triggerlessFlyoutId } visible>
				<CardBody>Code is Poetry</CardBody>
			</Flyout>
		);
		const flyouts = screen.getAllByRole( 'dialog' );
		const triggerlessFlyout = flyouts.find(
			( p ) => p.id === triggerlessFlyoutId
		);
		expect( triggerlessFlyout ).not.toBeUndefined();
	} );

	test( 'should render without content', () => {
		const contentlessFlyoutId = 'contentless-flyout';
		render(
			<Flyout
				baseId={ contentlessFlyoutId }
				trigger={ <Button>WordPress.org</Button> }
				visible
			/>
		);
		const flyouts = screen.getAllByRole( 'dialog' );
		const contentlessFlyout = flyouts.find(
			( p ) => p.id === contentlessFlyoutId
		);
		const baseFlyout = flyouts.find( ( p ) => p.id === baseFlyoutId );
		expect( contentlessFlyout ).toMatchDiffSnapshot( baseFlyout );
	} );

	test( 'should render label', () => {
		const labelledFlyoutId = 'labelled-flyout';
		render(
			<Flyout
				baseId={ labelledFlyoutId }
				label="show"
				trigger={ <Button>WordPress.org</Button> }
				visible
			>
				<CardBody>Code is Poetry</CardBody>
			</Flyout>
		);
		const flyouts = screen.getAllByRole( 'dialog' );
		const labelledFlyout = flyouts.find(
			( p ) => p.id === labelledFlyoutId
		);
		const baseFlyout = flyouts.find( ( p ) => p.id === baseFlyoutId );
		expect( labelledFlyout ).toMatchDiffSnapshot( baseFlyout );
	} );
} );
