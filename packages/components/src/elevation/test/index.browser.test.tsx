import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Elevation } from '..';

afterEach( cleanup );

test.each( [
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
		render(
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

test.each( [
	{ name: 'negative', value: -1 },
	{ name: 'NaN', value: NaN },
	{ name: 'infinite', value: Infinity },
] )(
	'preserves a consumer shadow when the base value is $name',
	( { value } ) => {
		render( <ConsumerShadow value={ value } /> );

		expect(
			getComputedStyle( page.getByTestId( 'elevation' ).element() )
				.boxShadow
		).toBe( 'rgb(0, 128, 0) 0px 0px 0px 3px' );
	}
);

test.each( [
	{ value: 0, shadow: 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' },
	{ value: 5, shadow: 'rgba(0, 0, 0, 0.25) 0px 5px 10px 0px' },
] )(
	'applies the base shadow above a consumer layer for value $value',
	( { value, shadow } ) => {
		render( <ConsumerShadow value={ value } /> );

		expect(
			getComputedStyle( page.getByTestId( 'elevation' ).element() )
				.boxShadow
		).toBe( shadow );
	}
);
