import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { Elevation } from '..';

const getGeneratedEmotionClassNames = ( element: HTMLElement ) =>
	Array.from( element.classList ).filter( ( className ) =>
		/^(css|emotion)-/.test( className )
	);

describe( 'Elevation', () => {
	it( 'renders the base elevation styles', () => {
		render( <Elevation data-testid="elevation" /> );
		const elevation = screen.getByTestId( 'elevation' );
		const styles = getComputedStyle( elevation );

		expect( elevation ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( styles.position ).toBe( 'absolute' );
		expect( styles.pointerEvents ).toBe( 'none' );
		expect( styles.backgroundColor ).toBe( 'rgba(0, 0, 0, 0)' );
	} );

	it( 'changes the shadow with the value prop', () => {
		render( <Elevation value={ 7 } data-testid="raised" /> );
		render( <Elevation value={ 0 } data-testid="flat" /> );

		expect(
			getComputedStyle( screen.getByTestId( 'raised' ) ).boxShadow
		).not.toBe(
			getComputedStyle( screen.getByTestId( 'flat' ) ).boxShadow
		);
	} );

	it( 'applies the interactive hover shadow', async () => {
		render(
			<div
				data-testid="target"
				style={ { position: 'relative', width: 40, height: 40 } }
			>
				<Elevation isInteractive value={ 7 } data-testid="elevation" />
			</div>
		);
		const elevation = screen.getByTestId( 'elevation' );
		const restingShadow = getComputedStyle( elevation ).boxShadow;

		await userEvent.hover( page.getByTestId( 'target' ) );

		await waitFor( () =>
			expect( getComputedStyle( elevation ).boxShadow ).not.toBe(
				restingShadow
			)
		);
	} );

	it( 'applies the configured focus shadow', async () => {
		render(
			<button
				type="button"
				data-testid="target"
				style={ { position: 'relative', width: 40, height: 40 } }
			>
				<Elevation focus={ 9 } value={ 7 } data-testid="elevation" />
			</button>
		);
		const elevation = screen.getByTestId( 'elevation' );
		const restingShadow = getComputedStyle( elevation ).boxShadow;

		await userEvent.tab();
		expect( screen.getByTestId( 'target' ) ).toHaveFocus();

		await waitFor( () =>
			expect( getComputedStyle( elevation ).boxShadow ).not.toBe(
				restingShadow
			)
		);
	} );

	it( 'applies the offset on every edge', () => {
		render( <Elevation offset={ -2 } data-testid="elevation" /> );
		const styles = getComputedStyle( screen.getByTestId( 'elevation' ) );

		expect( styles.top ).toBe( '-2px' );
		expect( styles.right ).toBe( '-2px' );
		expect( styles.bottom ).toBe( '-2px' );
		expect( styles.left ).toBe( '-2px' );
	} );

	it( 'composes interactive styles in a single generated class', () => {
		render(
			<Elevation
				active={ 5 }
				focus={ 9 }
				hover={ 14 }
				value={ 7 }
				data-testid="elevation"
			/>
		);

		expect(
			getGeneratedEmotionClassNames( screen.getByTestId( 'elevation' ) )
		).toHaveLength( 1 );
	} );
} );
