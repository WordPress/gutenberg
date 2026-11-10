import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GridItemMovers } from '../grid-item-movers';

vi.mock( import( '../../block-controls' ), () => ( {
	default: ( ( { children }: { children: ReactNode } ) => (
		<>{ children }</>
	) ) as never,
} ) );

vi.mock( import( '../use-get-number-of-blocks-before-cell' ), () => ( {
	useGetNumberOfBlocksBeforeCell: () => () => 0,
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useDispatch: ( () => ( {
		__unstableMarkNextChangeAsNotPersistent: vi.fn(),
		moveBlocksToPosition: vi.fn(),
	} ) ) as never,
} ) );

describe( 'GridItemMovers', () => {
	const box = { left: 0.1, top: 0.2, width: 0.5, height: 0.6 };
	const parentLayout = { columnCount: 4, rowCount: 4 };

	afterEach( () => {
		vi.clearAllMocks();
	} );

	it( 'moving a free block by a cell keeps its box', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<GridItemMovers
				layout={ {
					columnStart: 2,
					rowStart: 2,
					columnSpan: 1,
					rowSpan: 1,
					box,
				} }
				parentLayout={ parentLayout }
				onChange={ onChange }
				gridClientId="grid"
				blockClientId="block"
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Move right' } )
		);
		expect( onChange ).toHaveBeenLastCalledWith( {
			columnStart: 3,
			box,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Move down' } ) );
		expect( onChange ).toHaveBeenLastCalledWith( {
			rowStart: 3,
			box,
		} );
	} );

	it( 'moving a block without a box writes no box', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<GridItemMovers
				layout={ { columnStart: 2, rowStart: 2 } }
				parentLayout={ parentLayout }
				onChange={ onChange }
				gridClientId="grid"
				blockClientId="block"
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Move left' } ) );
		const change = onChange.mock.calls.at( -1 )?.[ 0 ];
		expect( change.columnStart ).toBe( 1 );
		expect( Object.hasOwn( change, 'box' ) ).toBe( true );
		expect( change.box ).toBeUndefined();
	} );
} );
