import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import Card from '../card';

afterEach( cleanup );

test.each( [
	{
		order: 'rounded first',
		rounded: [ true, false ],
		borderRadius: undefined,
	},
	{
		order: 'square first',
		rounded: [ false, true ],
		borderRadius: undefined,
	},
	{ order: 'rounded first', rounded: [ true, false ], borderRadius: 23 },
	{ order: 'square first', rounded: [ false, true ], borderRadius: 23 },
] )(
	'keeps both shadows aligned with the Card radius with $order and borderRadius=$borderRadius',
	async ( { rounded, borderRadius } ) => {
		render(
			<>
				{ rounded.map( ( isRounded ) => (
					<Card
						key={ String( isRounded ) }
						isRounded={ isRounded }
						elevation={ 5 }
						style={ { borderRadius } }
						data-testid={
							isRounded ? 'rounded-card' : 'square-card'
						}
					>
						Card content
					</Card>
				) ) }
			</>
		);

		for ( const isRounded of rounded ) {
			const card = page.getByTestId(
				isRounded ? 'rounded-card' : 'square-card'
			);
			const radius = borderRadius ?? ( isRounded ? 7 : 0 );
			await expect
				.poll( () =>
					Array.from(
						card
							.element()
							.querySelectorAll( '.components-elevation' ),
						( shadow ) => getComputedStyle( shadow ).borderRadius
					)
				)
				.toEqual( [ `${ radius }px`, `${ radius }px` ] );
		}
	}
);
