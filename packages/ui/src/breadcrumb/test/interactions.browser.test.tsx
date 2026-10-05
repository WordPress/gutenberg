import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import type { MouseEventHandler } from 'react';
import * as Breadcrumb from '../index';
import focusStyles from '../../utils/css/focus.module.scss';

function OverflowTrail( {
	onClick,
}: {
	onClick: MouseEventHandler< HTMLAnchorElement >;
} ) {
	const itemStyle = { width: 80 };
	return (
		<Breadcrumb.Root style={ { width: 280 } }>
			<Breadcrumb.LinkItem href="/" style={ itemStyle }>
				Home
			</Breadcrumb.LinkItem>
			<Breadcrumb.LinkItem
				href="/section"
				onClick={ onClick }
				style={ itemStyle }
			>
				Section
			</Breadcrumb.LinkItem>
			<Breadcrumb.LinkItem href="/page" style={ itemStyle }>
				Page
			</Breadcrumb.LinkItem>
			<Breadcrumb.CurrentItem style={ itemStyle }>
				Current
			</Breadcrumb.CurrentItem>
		</Breadcrumb.Root>
	);
}

function CurrentTrail( { width }: { width: number } ) {
	return (
		<>
			<Breadcrumb.Root style={ { width } }>
				<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
				<Breadcrumb.CurrentItem>
					A very long current page
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
			<button>After breadcrumb</button>
		</>
	);
}

function ClippedLinkTrail() {
	return (
		<Breadcrumb.Root style={ { width: 500 } }>
			<Breadcrumb.LinkItem href="/" style={ { maxWidth: 80 } }>
				Constrained ancestor
			</Breadcrumb.LinkItem>
			<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
		</Breadcrumb.Root>
	);
}

describe( 'Breadcrumb browser interactions', () => {
	it( 'contains exactly the collapsed link and closes on activation', async () => {
		await render(
			<OverflowTrail onClick={ ( event ) => event.preventDefault() } />
		);
		const trigger = page.getByRole( 'button', {
			name: 'Show 1 hidden breadcrumb item',
		} );
		await expect.element( trigger ).toBeVisible();
		expect( screen.getAllByRole( 'link' ) ).toHaveLength( 2 );
		await expect
			.element( trigger )
			.toHaveAttribute( 'aria-haspopup', 'menu' );
		await expect
			.element( trigger )
			.toHaveAttribute( 'aria-expanded', 'false' );
		await trigger.click();
		const menuLink = page.getByRole( 'menuitem', { name: 'Section' } );
		await expect.element( menuLink ).toBeVisible();
		await expect
			.element( page.getByRole( 'menu' ) )
			.toContainElement( menuLink.element() );
		await expect.element( menuLink ).toHaveAttribute( 'href', '/section' );
		await expect
			.element( page.getByRole( 'menuitem', { name: 'Home' } ) )
			.not.toBeInTheDocument();
		await expect
			.element( page.getByRole( 'menuitem', { name: 'Current' } ) )
			.not.toBeInTheDocument();
		await menuLink.click();
		await expect
			.element( page.getByRole( 'menu' ) )
			.not.toBeInTheDocument();
	} );

	it( 'activates an overflow link from the keyboard', async () => {
		const handleClick = vi.fn< MouseEventHandler< HTMLAnchorElement > >(
			( event ) => event.preventDefault()
		);
		await render( <OverflowTrail onClick={ handleClick } /> );
		const trigger = page.getByRole( 'button', {
			name: 'Show 1 hidden breadcrumb item',
		} );
		await expect.element( trigger ).toBeVisible();
		await userEvent.tab();
		await expect
			.element( page.getByRole( 'link', { name: 'Home' } ) )
			.toHaveFocus();
		await userEvent.tab();
		await expect.element( trigger ).toHaveFocus();
		await userEvent.keyboard( '{Enter}' );
		await expect
			.element( page.getByRole( 'menuitem', { name: 'Section' } ) )
			.toHaveFocus();
		await userEvent.keyboard( '{Enter}' );
		expect( handleClick ).toHaveBeenCalledTimes( 1 );
		await expect
			.element( page.getByRole( 'menu' ) )
			.not.toBeInTheDocument();
	} );

	it( 'keeps an untruncated current item out of the tab order', async () => {
		await render( <CurrentTrail width={ 500 } /> );
		const current = screen.getByText( 'A very long current page', {
			selector: '[aria-current="page"]',
		} );
		expect( current.scrollWidth ).toBe( current.clientWidth );
		expect( current ).not.toHaveAttribute( 'tabindex' );
		expect(
			screen.getAllByText( 'A very long current page' )
		).toHaveLength( 2 );
		await userEvent.tab();
		await expect
			.element( page.getByRole( 'link', { name: 'Home' } ) )
			.toHaveFocus();
		await userEvent.tab();
		await expect
			.element( page.getByRole( 'button', { name: 'After breadcrumb' } ) )
			.toHaveFocus();
	} );

	it( 'uses pluralized labels and supports menu keyboard behavior', async () => {
		const itemStyle = { width: 80 };
		await render(
			<Breadcrumb.Root style={ { width: 280 } }>
				<Breadcrumb.LinkItem href="/" style={ itemStyle }>
					Home
				</Breadcrumb.LinkItem>
				<Breadcrumb.LinkItem href="/alpha" style={ itemStyle }>
					Alpha
				</Breadcrumb.LinkItem>
				<Breadcrumb.LinkItem href="/beta" style={ itemStyle }>
					Beta
				</Breadcrumb.LinkItem>
				<Breadcrumb.LinkItem href="/page" style={ itemStyle }>
					Page
				</Breadcrumb.LinkItem>
				<Breadcrumb.CurrentItem style={ itemStyle }>
					Current
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		);

		const trigger = page.getByRole( 'button', {
			name: 'Show 2 hidden breadcrumb items',
		} );
		await expect.element( trigger ).toBeVisible();
		await userEvent.tab();
		await expect
			.element( page.getByRole( 'link', { name: 'Home' } ) )
			.toHaveFocus();
		await userEvent.tab();
		await expect.element( trigger ).toHaveFocus();
		await userEvent.keyboard( ' ' );

		const alpha = page.getByRole( 'menuitem', { name: 'Alpha' } );
		const beta = page.getByRole( 'menuitem', { name: 'Beta' } );
		await expect.element( alpha ).toHaveFocus();
		await userEvent.keyboard( '{ArrowDown}' );
		await expect.element( beta ).toHaveFocus();
		await userEvent.keyboard( '{ArrowUp}' );
		await expect.element( alpha ).toHaveFocus();
		await userEvent.keyboard( '{End}' );
		await expect.element( beta ).toHaveFocus();
		await userEvent.keyboard( '{Home}' );
		await expect.element( alpha ).toHaveFocus();
		await userEvent.keyboard( 'b' );
		await expect.element( beta ).toHaveFocus();
		await userEvent.keyboard( '{Escape}' );
		await expect.element( trigger ).toHaveFocus();

		await userEvent.keyboard( '{Enter}' );
		await expect.element( alpha ).toHaveFocus();
		await userEvent.tab();
		await expect
			.element( page.getByRole( 'menu' ) )
			.not.toBeInTheDocument();
	} );

	it( 'makes a truncated current item focusable and preserves focus when it expands', async () => {
		const view = await render( <CurrentTrail width={ 100 } /> );
		const current = screen.getByText( 'A very long current page', {
			selector: '[aria-current="page"]',
		} );
		await waitFor( () => {
			expect( current.scrollWidth ).toBeGreaterThan(
				current.clientWidth
			);
			expect( current ).toHaveAttribute( 'tabindex', '0' );
		} );
		await userEvent.tab();
		await expect
			.element(
				page.getByRole( 'button', { name: /hidden breadcrumb/ } )
			)
			.toHaveFocus();
		await userEvent.tab();
		await expect.element( current ).toHaveFocus();
		await waitFor( () =>
			expect(
				screen.getAllByText( 'A very long current page' )
			).toHaveLength( 3 )
		);
		expect(
			screen.getByText( 'A very long current page', {
				selector: '[data-open]',
			} )
		).toBeVisible();

		await view.rerender( <CurrentTrail width={ 500 } /> );
		await waitFor( () => {
			expect( current.scrollWidth ).toBe( current.clientWidth );
			expect( current ).toHaveFocus();
		} );
		expect( current ).toHaveAttribute( 'tabindex', '0' );
		expect( current ).toHaveClass(
			focusStyles[ 'outset-ring--focus-visible' ]
		);

		await userEvent.tab();
		await expect
			.element( page.getByRole( 'button', { name: 'After breadcrumb' } ) )
			.toHaveFocus();
		await expect.element( current ).not.toHaveAttribute( 'tabindex' );
		expect( current ).not.toHaveClass(
			focusStyles[ 'outset-ring--focus-visible' ]
		);
	} );

	it( 'shows the full text for an actually clipped link on focus', async () => {
		await render( <ClippedLinkTrail /> );
		const link = screen.getByRole( 'link', {
			name: 'Constrained ancestor',
		} );
		expect( link.scrollWidth ).toBeGreaterThan( link.clientWidth );
		await userEvent.tab();
		await expect.element( link ).toHaveFocus();
		await waitFor( () =>
			expect(
				screen.getAllByText( 'Constrained ancestor' )
			).toHaveLength( 3 )
		);
		expect(
			screen.getByText( 'Constrained ancestor', {
				selector: '[data-open]',
			} )
		).toBeVisible();
		expect( link ).toHaveTextContent( 'Constrained ancestor' );
	} );

	it( 'shows a clipped label tooltip on hover and dismisses it with Escape', async () => {
		await render( <ClippedLinkTrail /> );
		const link = page.getByRole( 'link', { name: 'Constrained ancestor' } );
		const element = link.element();
		expect( element.scrollWidth ).toBeGreaterThan( element.clientWidth );
		await link.hover();
		await waitFor( () =>
			expect(
				screen.getAllByText( 'Constrained ancestor' )
			).toHaveLength( 3 )
		);
		expect(
			screen.getByText( 'Constrained ancestor', {
				selector: '[data-open]',
			} )
		).toBeVisible();
		await expect
			.element( link )
			.toHaveAccessibleName( 'Constrained ancestor' );
		await userEvent.keyboard( '{Escape}' );
		await waitFor( () =>
			expect(
				screen.getAllByText( 'Constrained ancestor' )
			).toHaveLength( 2 )
		);
	} );
} );
