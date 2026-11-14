import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { setup, speak } from '@wordpress/a11y';
import Button from '..';

function SaveButton( props: ComponentProps< typeof Button > ) {
	return (
		<Button __next40pxDefaultSize { ...props }>
			Save changes
		</Button>
	);
}

describe( 'Button busy announcements', () => {
	beforeEach( () => {
		setup();
		speak( '' );
	} );

	it( 'announces loading when it becomes busy without changing its accessible name', () => {
		const { rerender } = render( <SaveButton /> );
		const button = screen.getByRole( 'button', { name: 'Save changes' } );
		expect( screen.queryByText( 'Loading' ) ).not.toBeInTheDocument();

		rerender( <SaveButton isBusy /> );

		expect( screen.getByText( 'Loading' ) ).toHaveAttribute(
			'aria-live',
			'polite'
		);
		expect( button ).toHaveAccessibleName( 'Save changes' );
		expect( button ).toBeEnabled();
	} );

	it( 'uses a custom loading announcement', () => {
		render(
			<SaveButton isBusy loadingAnnouncement="Saving your changes" />
		);

		expect( screen.getByText( 'Saving your changes' ) ).toHaveAttribute(
			'aria-live',
			'polite'
		);
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
		const { rerender } = render( <SaveButton isBusy /> );
		const liveRegion = screen.getByText( 'Loading' );

		speak( 'Another update' );
		rerender( <SaveButton isBusy /> );
		expect( liveRegion ).toHaveTextContent( 'Another update' );

		rerender( <SaveButton /> );
		rerender( <SaveButton isBusy /> );
		expect( liveRegion ).toHaveTextContent( 'Loading' );
	} );
} );
