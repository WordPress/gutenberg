import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOverlayScrollStateAttributes } from '../use-overlay-scroll-state-attributes';

function Harness( {
	contentHeight,
	onScroll,
}: {
	contentHeight: number;
	onScroll?: React.UIEventHandler< HTMLDivElement >;
} ) {
	const scrollState =
		useOverlayScrollStateAttributes< HTMLDivElement >( onScroll );

	return (
		<div
			{ ...scrollState }
			data-testid="scroll-container"
			style={ { height: 100, overflowY: 'auto', width: 100 } }
		>
			<div style={ { height: contentHeight } } />
		</div>
	);
}

describe( 'useOverlayScrollStateAttributes browser layout', () => {
	it( 'tracks overflow, scrolling, and content resize', async () => {
		const onScroll = vi.fn();
		const view = render(
			<Harness contentHeight={ 300 } onScroll={ onScroll } />
		);
		const container = screen.getByTestId( 'scroll-container' );

		await waitFor( () => {
			expect( container ).toHaveAttribute( 'tabindex', '0' );
		} );
		expect( container ).toHaveAttribute(
			'data-wp-ui-overlay-scrolled-from-bottom'
		);
		expect( container ).not.toHaveAttribute(
			'data-wp-ui-overlay-scrolled-from-top'
		);

		container.scrollTop = 100;
		fireEvent.scroll( container );

		expect( container ).toHaveAttribute(
			'data-wp-ui-overlay-scrolled-from-top'
		);
		expect( container ).toHaveAttribute(
			'data-wp-ui-overlay-scrolled-from-bottom'
		);
		expect( onScroll ).toHaveBeenCalledTimes( 1 );

		container.scrollTop = container.scrollHeight;
		fireEvent.scroll( container );

		expect( container ).toHaveAttribute(
			'data-wp-ui-overlay-scrolled-from-top'
		);
		expect( container ).not.toHaveAttribute(
			'data-wp-ui-overlay-scrolled-from-bottom'
		);

		view.rerender( <Harness contentHeight={ 50 } onScroll={ onScroll } /> );

		await waitFor( () => {
			expect( container ).not.toHaveAttribute( 'tabindex' );
		} );
		expect( container ).not.toHaveAttribute(
			'data-wp-ui-overlay-scrolled-from-top'
		);
		expect( container ).not.toHaveAttribute(
			'data-wp-ui-overlay-scrolled-from-bottom'
		);
	} );
} );
