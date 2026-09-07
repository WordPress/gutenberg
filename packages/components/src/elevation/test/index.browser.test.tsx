import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { Elevation } from '..';

function ConsumerShadow( { value }: { value: number } ) {
	return (
		<>
			<style>{ `@layer elevation-consumer {
				.elevation-consumer-shadow { box-shadow: 0 0 0 3px green; }
			}` }</style>
			<Elevation
				value={ value }
				className="elevation-consumer-shadow"
				data-testid="elevation"
			/>
		</>
	);
}

describe( 'Elevation', () => {
	it( 'renders the base elevation styles', async () => {
		await render( <Elevation data-testid="elevation" /> );
		const elevation = screen.getByTestId( 'elevation' );
		const styles = getComputedStyle( elevation );

		expect( elevation ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( styles.position ).toBe( 'absolute' );
		expect( styles.pointerEvents ).toBe( 'none' );
		expect( styles.backgroundColor ).toBe( 'rgba(0, 0, 0, 0)' );
	} );

	it( 'changes the shadow with the value prop', async () => {
		await render( <Elevation value={ 7 } data-testid="raised" /> );
		await render( <Elevation value={ 0 } data-testid="flat" /> );

		expect(
			getComputedStyle( screen.getByTestId( 'raised' ) ).boxShadow
		).not.toBe(
			getComputedStyle( screen.getByTestId( 'flat' ) ).boxShadow
		);
	} );

	it( 'applies the interactive hover shadow', async () => {
		await render(
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
		await render(
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

	it( 'applies the configured hover and active shadows', async () => {
		await render(
			<>
				<div
					data-testid="target"
					style={ { position: 'relative', width: 40, height: 40 } }
				>
					<Elevation
						active={ 5 }
						hover={ 14 }
						value={ 7 }
						data-testid="elevation"
						style={ { transition: 'none' } }
					/>
				</div>
				<Elevation value={ 14 } data-testid="hover-reference" />
				<Elevation value={ 5 } data-testid="active-reference" />
			</>
		);
		const target = screen.getByTestId( 'target' );
		const elevation = screen.getByTestId( 'elevation' );
		const expectedHoverShadow = getComputedStyle(
			screen.getByTestId( 'hover-reference' )
		).boxShadow;
		const expectedActiveShadow = getComputedStyle(
			screen.getByTestId( 'active-reference' )
		).boxShadow;
		let pressedShadow: string | undefined;
		target.addEventListener( 'mousedown', () => {
			pressedShadow = getComputedStyle( elevation ).boxShadow;
		} );

		await userEvent.hover( page.getByTestId( 'target' ) );
		expect( getComputedStyle( elevation ).boxShadow ).toBe(
			expectedHoverShadow
		);

		await userEvent.click( page.getByTestId( 'target' ) );
		expect( pressedShadow ).toBe( expectedActiveShadow );
	} );

	it( 'applies the offset on every edge', async () => {
		await render( <Elevation offset={ -2 } data-testid="elevation" /> );
		const styles = getComputedStyle( screen.getByTestId( 'elevation' ) );

		expect( styles.top ).toBe( '-2px' );
		expect( styles.right ).toBe( '-2px' );
		expect( styles.bottom ).toBe( '-2px' );
		expect( styles.left ).toBe( '-2px' );
	} );

	it.each( [
	{
		name: 'automatic',
		props: { value: 5, isInteractive: true },
		hover: 'rgba(0, 0, 0, 0.5) 0px 10px 20px 0px',
		focus: 'rgba(0, 0, 0, 0.5) 0px 10px 20px 0px',
		active: 'rgba(0, 0, 0, 0.125) 0px 2.5px 5px 0px',
	},
	{
		name: 'custom',
		props: { value: 7, hover: 14, focus: 9, active: 5 },
		hover: 'rgba(0, 0, 0, 0.7) 0px 14px 28px 0px',
		focus: 'rgba(0, 0, 0, 0.45) 0px 9px 18px 0px',
		active: 'rgba(0, 0, 0, 0.25) 0px 5px 10px 0px',
	},
	{
		name: 'invalid hover',
		props: { value: 7, hover: -1, focus: 9, active: 5 },
		hover: 'rgba(0, 0, 0, 0.35) 0px 7px 14px 0px',
		focus: 'rgba(0, 0, 0, 0.45) 0px 9px 18px 0px',
		active: 'rgba(0, 0, 0, 0.25) 0px 5px 10px 0px',
	},
	{
		name: 'invalid focus',
		props: { value: 7, hover: 14, focus: -1, active: 5 },
		hover: 'rgba(0, 0, 0, 0.7) 0px 14px 28px 0px',
		focus: 'rgba(0, 0, 0, 0.7) 0px 14px 28px 0px',
		active: 'rgba(0, 0, 0, 0.25) 0px 5px 10px 0px',
	},
	{
		name: 'invalid active',
		props: { value: 7, hover: 14, focus: 9, active: -1 },
		hover: 'rgba(0, 0, 0, 0.7) 0px 14px 28px 0px',
		focus: 'rgba(0, 0, 0, 0.45) 0px 9px 18px 0px',
		active: 'rgba(0, 0, 0, 0.45) 0px 9px 18px 0px',
	},
	{
		name: 'zero',
		props: { value: 7, isInteractive: true, hover: 0, focus: 0, active: 0 },
		hover: 'rgba(0, 0, 0, 0) 0px 0px 0px 0px',
		focus: 'rgba(0, 0, 0, 0) 0px 0px 0px 0px',
		active: 'rgba(0, 0, 0, 0) 0px 0px 0px 0px',
	},
] )(
	'uses $name shadows when the parent is hovered, focused, and pressed',
	async ( { props, hover, focus, active } ) => {
		await render(
			<button>
				Shadow parent
				<Elevation { ...props } data-testid="elevation" />
			</button>
		);

		const parent = page.getByRole( 'button', { name: 'Shadow parent' } );
		const shadow = page.getByTestId( 'elevation' );
		const getShadow = () => getComputedStyle( shadow.element() ).boxShadow;

		await userEvent.hover( parent );
		await expect.poll( getShadow ).toBe( hover );
		await userEvent.tab();
		await expect.poll( getShadow ).toBe( focus );
		await userEvent.keyboard( '[Space>]' );
		await expect.poll( getShadow ).toBe( active );
		await userEvent.keyboard( '[/Space]' );
	}
);

	it.each( [
	{ name: 'negative', value: -1 },
	{ name: 'NaN', value: NaN },
	{ name: 'infinite', value: Infinity },
] )(
	'preserves a consumer shadow when the base value is $name',
	async ( { value } ) => {
		await render( <ConsumerShadow value={ value } /> );

		expect(
			getComputedStyle( page.getByTestId( 'elevation' ).element() )
				.boxShadow
		).toBe( 'rgb(0, 128, 0) 0px 0px 0px 3px' );
	}
);

	it.each( [
	{ value: 0, shadow: 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' },
	{ value: 5, shadow: 'rgba(0, 0, 0, 0.25) 0px 5px 10px 0px' },
] )(
	'applies the base shadow above a consumer layer for value $value',
	async ( { value, shadow } ) => {
		await render( <ConsumerShadow value={ value } /> );

		expect(
			getComputedStyle( page.getByTestId( 'elevation' ).element() )
				.boxShadow
		).toBe( shadow );
	}
);
} );
