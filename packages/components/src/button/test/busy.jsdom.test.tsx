import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { setup, speak } from '@wordpress/a11y';
import Button from '..';

describe( 'Button busy announcements', () => {
	beforeEach( () => {
		setup();
		speak( '' );
	} );

	it( 'announces loading when it becomes busy without changing its accessible name', () => {
		const { rerender } = render(
			<Button __next40pxDefaultSize>Save changes</Button>
		);
		const button = screen.getByRole( 'button', { name: 'Save changes' } );
		expect( screen.queryByText( 'Loading' ) ).not.toBeInTheDocument();

		rerender(
			<Button __next40pxDefaultSize isBusy>
				Save changes
			</Button>
		);

		expect( screen.getByText( 'Loading' ) ).toHaveAttribute(
			'aria-live',
			'polite'
		);
		expect( button ).toHaveAccessibleName( 'Save changes' );
		expect( button ).toBeEnabled();
	} );

	it( 'uses a custom loading announcement', () => {
		render(
			<Button
				__next40pxDefaultSize
				isBusy
				loadingAnnouncement="Saving your changes"
			>
				Save changes
			</Button>
		);

		expect( screen.getByText( 'Saving your changes' ) ).toHaveAttribute(
			'aria-live',
			'polite'
		);
		expect(
			screen.getByRole( 'button', { name: 'Save changes' } )
		).not.toHaveAttribute( 'loadingAnnouncement' );
	} );

	it( 'lets the caller suppress the loading announcement', () => {
		speak( 'Installing fonts' );
		const liveRegion = screen.getByText( 'Installing fonts' );
		render(
			<Button __next40pxDefaultSize isBusy loadingAnnouncement="">
				Install
			</Button>
		);

		expect( liveRegion ).toHaveTextContent( 'Installing fonts' );
	} );

	it( 'announces each busy period without repeating on ordinary rerenders', () => {
		const { rerender } = render(
			<Button __next40pxDefaultSize isBusy>
				Save changes
			</Button>
		);
		const liveRegion = screen.getByText( 'Loading' );

		speak( 'Another update' );
		rerender(
			<Button __next40pxDefaultSize isBusy>
				Save changes
			</Button>
		);
		expect( liveRegion ).toHaveTextContent( 'Another update' );

		rerender( <Button __next40pxDefaultSize>Save changes</Button> );
		rerender(
			<Button __next40pxDefaultSize isBusy>
				Save changes
			</Button>
		);
		expect( liveRegion ).toHaveTextContent( 'Loading' );
	} );
} );
