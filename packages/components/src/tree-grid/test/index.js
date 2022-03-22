/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { LEFT, RIGHT, UP, DOWN, HOME, END } from '@wordpress/keycodes';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGrid from '../';
import TreeGridRow from '../row';
import TreeGridCell from '../cell';

const TestButton = forwardRef( ( { ...props }, ref ) => (
	<button { ...props } ref={ ref }></button>
) );

describe( 'TreeGrid', () => {
	const originalGetClientRects = window.Element.prototype.getClientRects;

	// `getClientRects` needs to be mocked so that `isVisible` from the `@wordpress/dom`
	// `focusable` module can pass, in a JSDOM env where the DOM elements have no width/height.
	const mockedGetClientRects = jest.fn( () => [
		{
			x: 0,
			y: 0,
			width: 100,
			height: 100,
		},
	] );

	beforeAll( () => {
		window.Element.prototype.getClientRects = jest.fn(
			mockedGetClientRects
		);
	} );

	afterAll( () => {
		window.Element.prototype.getClientRects = originalGetClientRects;
	} );

	describe( 'simple rendering', () => {
		it( 'renders a table, tbody and any child elements', () => {
			const { container } = render(
				<TreeGrid>
					<TreeGridRow level={ 1 } positionInSet={ 1 } setSize={ 1 }>
						<TreeGridCell withoutGridItem>Test</TreeGridCell>
					</TreeGridRow>
				</TreeGrid>
			);

			expect( container.innerHTML ).toMatchSnapshot();
		} );
	} );

	describe( 'onExpandRow', () => {
		it( 'should call onExpandRow when pressing Right Arrow on a collapsed row', () => {
			const onExpandRow = jest.fn();

			render(
				<TreeGrid onExpandRow={ onExpandRow }>
					<TreeGridRow
						level={ 1 }
						positionInSet={ 1 }
						setSize={ 3 }
						isExpanded={ false }
					>
						<TreeGridCell withoutGridItem>
							<TestButton aria-expanded="false">Row 1</TestButton>
						</TreeGridCell>
					</TreeGridRow>
					<TreeGridRow
						level={ 1 }
						positionInSet={ 2 }
						setSize={ 3 }
						isExpanded={ false }
					>
						<TreeGridCell withoutGridItem>
							<TestButton>Row 2</TestButton>
						</TreeGridCell>
					</TreeGridRow>
					<TreeGridRow
						level={ 1 }
						positionInSet={ 3 }
						setSize={ 3 }
						isExpanded={ false }
					>
						<TreeGridCell withoutGridItem>
							<TestButton>Row 3</TestButton>
						</TreeGridCell>
					</TreeGridRow>
				</TreeGrid>
			);

			screen.getByText( 'Row 1' ).focus();
			const row1Element = screen.getByText( 'Row 1' ).closest( 'tr' );

			fireEvent.keyDown( screen.getByText( 'Row 1' ), {
				key: 'ArrowRight',
				keyCode: RIGHT,
				currentTarget: row1Element,
			} );

			expect( onExpandRow ).toHaveBeenCalledWith( row1Element );
		} );
	} );

	describe( 'onCollapseRow', () => {
		it( 'should call onCollapseRow when pressing Left Arrow on an expanded row', () => {
			const onCollapseRow = jest.fn();

			render(
				<TreeGrid onCollapseRow={ onCollapseRow }>
					<TreeGridRow
						level={ 1 }
						positionInSet={ 1 }
						setSize={ 3 }
						isExpanded={ true }
					>
						<TreeGridCell withoutGridItem>
							<TestButton aria-expanded="true">Row 1</TestButton>
						</TreeGridCell>
					</TreeGridRow>
					<TreeGridRow
						level={ 1 }
						positionInSet={ 2 }
						setSize={ 3 }
						isExpanded={ false }
					>
						<TreeGridCell withoutGridItem>
							<TestButton>Row 2</TestButton>
						</TreeGridCell>
					</TreeGridRow>
					<TreeGridRow
						level={ 1 }
						positionInSet={ 3 }
						setSize={ 3 }
						isExpanded={ false }
					>
						<TreeGridCell withoutGridItem>
							<TestButton>Row 3</TestButton>
						</TreeGridCell>
					</TreeGridRow>
				</TreeGrid>
			);

			screen.getByText( 'Row 1' ).focus();
			const row1Element = screen.getByText( 'Row 1' ).closest( 'tr' );

			fireEvent.keyDown( screen.getByText( 'Row 1' ), {
				key: 'ArrowLeft',
				keyCode: LEFT,
				currentTarget: row1Element,
			} );

			expect( onCollapseRow ).toHaveBeenCalledWith( row1Element );
		} );
	} );

	describe( 'onFocusRow', () => {
		const TestTree = ( { onFocusRow } ) => (
			<TreeGrid onFocusRow={ onFocusRow }>
				<TreeGridRow level={ 1 } positionInSet={ 1 } setSize={ 3 }>
					<TreeGridCell withoutGridItem>
						<TestButton>Row 1</TestButton>
					</TreeGridCell>
				</TreeGridRow>
				<TreeGridRow level={ 1 } positionInSet={ 2 } setSize={ 3 }>
					<TreeGridCell withoutGridItem>
						<TestButton>Row 2</TestButton>
					</TreeGridCell>
				</TreeGridRow>
				<TreeGridRow level={ 1 } positionInSet={ 3 } setSize={ 3 }>
					<TreeGridCell withoutGridItem>
						<TestButton>Row 3</TestButton>
					</TreeGridCell>
				</TreeGridRow>
			</TreeGrid>
		);

		it( 'should call onFocusRow with event, start and end nodes when pressing Down Arrow', () => {
			const onFocusRow = jest.fn();
			render( <TestTree onFocusRow={ onFocusRow } /> );

			screen.getByText( 'Row 2' ).focus();

			const row2Element = screen.getByText( 'Row 2' ).closest( 'tr' );
			const row3Element = screen.getByText( 'Row 3' ).closest( 'tr' );

			fireEvent.keyDown( screen.getByText( 'Row 2' ), {
				key: 'ArrowDown',
				keyCode: DOWN,
				currentTarget: row2Element,
			} );

			expect( onFocusRow ).toHaveBeenCalledWith(
				expect.objectContaining( { key: 'ArrowDown', keyCode: DOWN } ),
				row2Element,
				row3Element
			);
		} );

		it( 'should call onFocusRow with event, start and end nodes when pressing End', () => {
			const onFocusRow = jest.fn();
			render( <TestTree onFocusRow={ onFocusRow } /> );

			screen.getByText( 'Row 1' ).focus();

			const row1Element = screen.getByText( 'Row 1' ).closest( 'tr' );
			const row3Element = screen.getByText( 'Row 3' ).closest( 'tr' );

			fireEvent.keyDown( screen.getByText( 'Row 1' ), {
				key: 'End',
				keyCode: END,
				currentTarget: row1Element,
			} );

			expect( onFocusRow ).toHaveBeenCalledWith(
				expect.objectContaining( { key: 'End', keyCode: END } ),
				row1Element,
				row3Element
			);
		} );

		it( 'should call onFocusRow with event, start and end nodes when pressing Up Arrow', () => {
			const onFocusRow = jest.fn();
			render( <TestTree onFocusRow={ onFocusRow } /> );

			screen.getByText( 'Row 2' ).focus();

			const row2Element = screen.getByText( 'Row 2' ).closest( 'tr' );
			const row1Element = screen.getByText( 'Row 1' ).closest( 'tr' );

			fireEvent.keyDown( screen.getByText( 'Row 2' ), {
				key: 'ArrowUp',
				keyCode: UP,
				currentTarget: row2Element,
			} );

			expect( onFocusRow ).toHaveBeenCalledWith(
				expect.objectContaining( { key: 'ArrowUp', keyCode: UP } ),
				row2Element,
				row1Element
			);
		} );

		it( 'should call onFocusRow with event, start and end nodes when pressing Home', () => {
			const onFocusRow = jest.fn();
			render( <TestTree onFocusRow={ onFocusRow } /> );

			screen.getByText( 'Row 3' ).focus();

			const row3Element = screen.getByText( 'Row 3' ).closest( 'tr' );
			const row1Element = screen.getByText( 'Row 1' ).closest( 'tr' );

			fireEvent.keyDown( screen.getByText( 'Row 3' ), {
				key: 'Home',
				keyCode: HOME,
				currentTarget: row3Element,
			} );

			expect( onFocusRow ).toHaveBeenCalledWith(
				expect.objectContaining( { key: 'Home', keyCode: HOME } ),
				row3Element,
				row1Element
			);
		} );

		it( 'should call onFocusRow when shift key is held', () => {
			const onFocusRow = jest.fn();
			render( <TestTree onFocusRow={ onFocusRow } /> );

			screen.getByText( 'Row 2' ).focus();

			const row2Element = screen.getByText( 'Row 2' ).closest( 'tr' );
			const row1Element = screen.getByText( 'Row 1' ).closest( 'tr' );

			fireEvent.keyDown( screen.getByText( 'Row 2' ), {
				key: 'ArrowUp',
				keyCode: UP,
				currentTarget: row2Element,
				shiftKey: true,
			} );

			expect( onFocusRow ).toHaveBeenLastCalledWith(
				expect.objectContaining( {
					key: 'ArrowUp',
					keyCode: UP,
					shiftKey: true,
				} ),
				row2Element,
				row1Element
			);

			fireEvent.keyDown( screen.getByText( 'Row 1' ), {
				key: 'ArrowDown',
				keyCode: DOWN,
				currentTarget: row1Element,
				shiftKey: true,
			} );

			expect( onFocusRow ).toHaveBeenLastCalledWith(
				expect.objectContaining( {
					key: 'ArrowDown',
					keyCode: DOWN,
					shiftKey: true,
				} ),
				row1Element,
				row2Element
			);
		} );
	} );
} );
