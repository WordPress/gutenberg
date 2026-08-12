import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useState } from '@wordpress/element';
import { GRID_ITEM_DATA_KEY } from '../../shared/grid-item-key';
import { useLanePlacement } from '../use-lane-placement';

const originalSupports = CSS.supports;

beforeEach( () => {
	CSS.supports = ( property: string, value?: string ) => {
		if ( property === 'display' && value === 'grid-lanes' ) {
			return false;
		}
		return value === undefined
			? originalSupports( property )
			: originalSupports( property, value );
	};
} );

afterEach( () => {
	CSS.supports = originalSupports;
} );

function Harness( { firstHeight }: { firstHeight: number } ) {
	const [ container, setContainer ] = useState< HTMLDivElement | null >(
		null
	);
	const items = [
		{ key: 'a', span: 1 },
		{ key: 'b', span: 1 },
	];
	const result = useLanePlacement( container, {
		items,
		lanes: 1,
		gap: 0,
		flowTolerance: 0,
		rowUnit: 4,
	} );

	return (
		<div ref={ setContainer }>
			{ items.map( ( item ) => (
				<div
					key={ item.key }
					{ ...{ [ GRID_ITEM_DATA_KEY ]: item.key } }
					data-testid={ `item-${ item.key }` }
					style={ {
						...result.itemStyles.get( item.key ),
						height: item.key === 'a' ? firstHeight : 50,
					} }
				/>
			) ) }
		</div>
	);
}

describe( 'useLanePlacement browser measurements', () => {
	it( 'recomputes lane placement when an item resizes', async () => {
		const view = render( <Harness firstHeight={ 100 } /> );
		const secondItem = screen.getByTestId( 'item-b' );

		await waitFor( () => {
			expect( secondItem ).toHaveStyle( { gridRowStart: '26' } );
		} );

		view.rerender( <Harness firstHeight={ 200 } /> );

		await waitFor( () => {
			expect( secondItem ).toHaveStyle( { gridRowStart: '51' } );
		} );
	} );
} );
