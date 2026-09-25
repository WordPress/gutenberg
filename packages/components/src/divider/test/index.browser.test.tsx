import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { Divider } from '..';

describe( 'props', () => {
	const readMargin = ( property: string ) =>
		getComputedStyle( screen.getByRole( 'separator' ) )
			.getPropertyValue( property )
			.trim();

	test( 'should render a horizontal separator by default', async () => {
		await render( <Divider /> );

		const divider = screen.getByRole( 'separator' );
		expect( divider ).toHaveAttribute( 'aria-orientation', 'horizontal' );
	} );

	test( 'should render marginStart', async () => {
		await render( <Divider marginStart={ 5 } /> );

		expect( readMargin( '--wp-components-divider-margin-start' ) ).toBe(
			'calc(4px * 5)'
		);
	} );

	test( 'should render marginEnd', async () => {
		await render( <Divider marginEnd={ 5 } /> );

		expect( readMargin( '--wp-components-divider-margin-end' ) ).toBe(
			'calc(4px * 5)'
		);
	} );

	test( 'should render margin', async () => {
		await render( <Divider margin={ 7 } /> );

		expect( readMargin( '--wp-components-divider-margin-start' ) ).toBe(
			'calc(4px * 7)'
		);
		expect( readMargin( '--wp-components-divider-margin-end' ) ).toBe(
			'calc(4px * 7)'
		);
	} );

	test( 'should render vertical orientation', async () => {
		await render( <Divider orientation="vertical" /> );

		const divider = screen.getByRole( 'separator' );
		expect( divider ).toHaveAttribute( 'aria-orientation', 'vertical' );
	} );
} );
