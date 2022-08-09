/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Tooltip from '../';
/**
 * WordPress dependencies
 */
import { TOOLTIP_DELAY } from '../index.js';

describe( 'Tooltip', () => {
	describe( '#render()', () => {
		it( 'should render children (abort) if multiple children passed', () => {
			const { container } = render(
				<Tooltip>
					<div />
					<div />
				</Tooltip>
			);

			expect( container.children ).toHaveLength( 2 );
		} );

		it( 'should render children', () => {
			render(
				<Tooltip position="bottom right" text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			expect( button.nodeName ).toBe( 'BUTTON' );
			expect( button.childNodes ).toHaveLength( 1 );
			expect( button ).toHaveTextContent( 'Hover Me!' );
		} );

		it( 'should render children with additional popover when over', () => {
			const { container } = render(
				<Tooltip position="bottom right" text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			button.focus();
			expect( button.nodeName ).toBe( 'BUTTON' );
			expect( button.childNodes ).toHaveLength( 2 );
			expect( button.childNodes[ 0 ] ).toHaveTextContent( 'Hover Me!' );

			const popover =
				container.getElementsByClassName( 'components-popover' );
			expect( popover ).toHaveLength( 1 );
			expect( popover[ 0 ].firstChild ).toHaveTextContent( 'Help text' );
		} );

		it( 'should show popover on focus', () => {
			const originalFocus = jest.fn();
			const { container } = render(
				<Tooltip text="Help text">
					<button
						onMouseEnter={ originalFocus }
						onFocus={ originalFocus }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			button.focus();

			const popover =
				container.getElementsByClassName( 'components-popover' );
			expect( originalFocus ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'focus',
				} )
			);
			expect( popover ).toHaveLength( 1 );
		} );

		it( 'should not show popover on focus as result of mousedown', async () => {
			const originalOnMouseDown = jest.fn();
			const originalOnMouseUp = jest.fn();
			const { container } = render(
				<Tooltip text="Help text">
					<button
						onMouseDown={ originalOnMouseDown }
						onMouseUp={ originalOnMouseUp }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			fireEvent.mouseDown( button );
			expect( originalOnMouseDown ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'mousedown',
				} )
			);

			button.focus();
			const popover =
				container.getElementsByClassName( 'components-popover' );
			expect( popover ).toHaveLength( 0 );

			fireEvent.mouseUp( button );
			expect( originalOnMouseUp ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'mouseup',
				} )
			);
		} );

		it( 'should show popover on delayed mouseenter', () => {
			const originalMouseEnter = jest.fn();
			jest.useFakeTimers();
			const { container } = render(
				<Tooltip text="Help text">
					<button
						onMouseEnter={ originalMouseEnter }
						onFocus={ originalMouseEnter }
					>
						<span>Hover Me!</span>
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			fireEvent.mouseOver( button );
			const popoverBeforeTimeout =
				container.getElementsByClassName( 'components-popover' );
			expect( popoverBeforeTimeout ).toHaveLength( 0 );
			expect( originalMouseEnter ).toHaveBeenCalledTimes( 1 );

			// Force delayedSetIsOver to be called.
			setTimeout( () => {
				const popoverAfterTimeout =
					container.getElementsByClassName( 'components-popover' );
				expect( popoverAfterTimeout ).toHaveLength( 1 );

				jest.runOnlyPendingTimers();
				jest.useRealTimers();
			}, TOOLTIP_DELAY );
		} );

		it( 'should respect custom delay prop when showing popover', () => {
			const originalMouseEnter = jest.fn();
			jest.useFakeTimers();
			const { container } = render(
				<Tooltip text="Help text" delay={ 2000 }>
					<button
						onMouseEnter={ originalMouseEnter }
						onFocus={ originalMouseEnter }
					>
						<span>Hover Me!</span>
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			fireEvent.mouseOver( button );
			const popoverBeforeTimeout =
				container.getElementsByClassName( 'components-popover' );
			expect( popoverBeforeTimeout ).toHaveLength( 0 );
			expect( originalMouseEnter ).toHaveBeenCalledTimes( 1 );

			// Popover does not yet exist after default delay, because custom delay is passed.
			setTimeout( () => {
				const popoverBetweenTimeout =
					container.getElementsByClassName( 'components-popover' );
				expect( popoverBetweenTimeout ).toHaveLength( 0 );
			}, TOOLTIP_DELAY );
			// Popover appears after custom delay.
			setTimeout( () => {
				const popoverAfterTimeout =
					container.getElementsByClassName( 'components-popover' );
				expect( popoverAfterTimeout ).toHaveLength( 1 );
				jest.runOnlyPendingTimers();
				jest.useRealTimers();
			}, 2000 );
		} );

		it( 'should show tooltip when an element is disabled', () => {
			const { container } = render(
				<Tooltip text="Show helpful text here">
					<button disabled>Click me</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			const buttonRect = button.getBoundingClientRect();
			const eventCatcher =
				container.getElementsByClassName( 'event-catcher' )[ 0 ];
			const eventCatcherRect = eventCatcher.getBoundingClientRect();
			expect( buttonRect ).toEqual( eventCatcherRect );

			fireEvent.mouseOver( eventCatcher );

			setTimeout( () => {
				const popover =
					container.getElementsByClassName( 'components-popover' );
				expect( popover ).toHaveLength( 1 );
			}, TOOLTIP_DELAY );
		} );

		it( 'should not emit events back to children when they are disabled', () => {
			const handleClick = jest.fn();
			const { container } = render(
				<Tooltip text="Show helpful text here">
					<button disabled onClick={ handleClick }>
						Click me
					</button>
				</Tooltip>
			);

			const eventCatcher =
				container.getElementsByClassName( 'event-catcher' )[ 0 ];
			fireEvent.click( eventCatcher );
			expect( handleClick ).not.toHaveBeenCalled();
		} );

		it( 'should cancel pending setIsOver on mouseleave', () => {
			const originalMouseEnter = jest.fn();
			const { container } = render(
				<Tooltip text="Help text">
					<button
						onMouseEnter={ originalMouseEnter }
						onFocus={ originalMouseEnter }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			fireEvent.mouseOver( button );
			setTimeout( () => {
				const popover =
					container.getElementsByClassName( 'components-popover' );
				expect( popover ).toHaveLength( 0 );
			}, TOOLTIP_DELAY );
		} );
	} );
} );
