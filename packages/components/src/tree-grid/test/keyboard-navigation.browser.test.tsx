import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { UP, DOWN, HOME, END } from '@wordpress/keycodes';
import { forwardRef } from '@wordpress/element';
import TreeGrid from '..';
import TreeGridRow from '../row';
import TreeGridCell from '../cell';

const TestButton = forwardRef(
	(
		{ ...props }: React.ComponentPropsWithoutRef< 'button' >,
		ref: React.ForwardedRef< HTMLButtonElement >
	) => <button { ...props } ref={ ref }></button>
);

const TestTree = ( {
	onFocusRow,
}: {
	onFocusRow: React.ComponentProps< typeof TreeGrid >[ 'onFocusRow' ];
} ) => (
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

describe( 'TreeGrid keyboard navigation', () => {
	it( 'should call onExpandRow when pressing Right Arrow on a collapsed row', async () => {
		const user = userEvent.setup();
		const onExpandRow = vi.fn();

		await render(
			<TreeGrid onExpandRow={ onExpandRow }>
				<TreeGridRow
					level={ 1 }
					positionInSet={ 1 }
					setSize={ 1 }
					isExpanded={ false }
				>
					<TreeGridCell withoutGridItem>
						<TestButton aria-expanded="false">Row 1</TestButton>
					</TreeGridCell>
				</TreeGridRow>
			</TreeGrid>
		);

		const row1Button = screen.getByRole( 'button', { name: 'Row 1' } );
		const row1Element = screen.getByRole( 'row', { name: 'Row 1' } );
		row1Button.focus();
		await user.keyboard( '{ArrowRight}' );

		expect( onExpandRow ).toHaveBeenCalledWith( row1Element );
	} );

	it( 'should call onCollapseRow when pressing Left Arrow on an expanded row', async () => {
		const user = userEvent.setup();
		const onCollapseRow = vi.fn();

		await render(
			<TreeGrid onCollapseRow={ onCollapseRow }>
				<TreeGridRow
					level={ 1 }
					positionInSet={ 1 }
					setSize={ 1 }
					isExpanded
				>
					<TreeGridCell withoutGridItem>
						<TestButton aria-expanded="true">Row 1</TestButton>
					</TreeGridCell>
				</TreeGridRow>
			</TreeGrid>
		);

		const row1Button = screen.getByRole( 'button', { name: 'Row 1' } );
		const row1Element = screen.getByRole( 'row', { name: 'Row 1' } );
		row1Button.focus();
		await user.keyboard( '{ArrowLeft}' );

		expect( onCollapseRow ).toHaveBeenCalledWith( row1Element );
	} );

	it.each( [
		[ 'Down Arrow', 'Row 2', '{ArrowDown}', DOWN, 'Row 3' ],
		[ 'End', 'Row 1', '{End}', END, 'Row 3' ],
		[ 'Up Arrow', 'Row 2', '{ArrowUp}', UP, 'Row 1' ],
		[ 'Home', 'Row 3', '{Home}', HOME, 'Row 1' ],
	] )(
		'should call onFocusRow when pressing %s',
		async ( _, start, key, keyCode, end ) => {
			const user = userEvent.setup();
			const onFocusRow = vi.fn();
			await render( <TestTree onFocusRow={ onFocusRow } /> );

			const startButton = screen.getByRole( 'button', { name: start } );
			const startRow = screen.getByRole( 'row', { name: start } );
			const endRow = screen.getByRole( 'row', { name: end } );
			startButton.focus();
			await user.keyboard( key );

			expect( onFocusRow ).toHaveBeenCalledWith(
				expect.objectContaining( { keyCode } ),
				startRow,
				endRow
			);
		}
	);

	it( 'should call onFocusRow when shift is held', async () => {
		const user = userEvent.setup();
		const onFocusRow = vi.fn();
		await render( <TestTree onFocusRow={ onFocusRow } /> );

		const row1Button = screen.getByRole( 'button', { name: 'Row 1' } );
		const row2Button = screen.getByRole( 'button', { name: 'Row 2' } );
		const row1Element = screen.getByRole( 'row', { name: 'Row 1' } );
		const row2Element = screen.getByRole( 'row', { name: 'Row 2' } );

		row2Button.focus();
		await user.keyboard( '{Shift>}{ArrowUp}{/Shift}' );
		expect( onFocusRow ).toHaveBeenLastCalledWith(
			expect.objectContaining( { keyCode: UP, shiftKey: true } ),
			row2Element,
			row1Element
		);

		row1Button.focus();
		await user.keyboard( '{Shift>}{ArrowDown}{/Shift}' );
		expect( onFocusRow ).toHaveBeenLastCalledWith(
			expect.objectContaining( { keyCode: DOWN, shiftKey: true } ),
			row1Element,
			row2Element
		);
	} );
} );
