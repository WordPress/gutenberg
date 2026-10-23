import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { screen, within } from '@testing-library/react';
import { useState } from '@wordpress/element';
import { compileCSS } from '@wordpress/style-engine';
import type { Style } from '@wordpress/style-engine';
import DimensionsPanel from '../dimensions-panel';
import type { PanelStyle } from '../types';

describe( 'DimensionsPanel CSS box shorthand', () => {
	it.each( [ 'padding', 'margin' ] as const )(
		'keeps the rendered %s on untouched sides after editing one side',
		async ( property ) => {
			function Fixture() {
				const [ value, setValue ] = useState< PanelStyle >( {
					spacing: { [ property ]: '68px 32px' },
				} );
				return (
					<>
						<DimensionsPanel
							value={ value }
							onChange={ setValue }
							settings={ {
								spacing: {
									[ property ]: true,
									units: [ 'px' ],
								},
							} }
						/>
						<style>
							{ compileCSS( value as Style, {
								selector: '.spacing-preview',
							} ) }
						</style>
						<div className="spacing-preview">Spacing preview</div>
					</>
				);
			}

			await render( <Fixture /> );
			const preview = screen.getByText( 'Spacing preview' );
			expect( getComputedStyle( preview )[ property ] ).toBe(
				'68px 32px'
			);
			const control = within(
				screen.getByRole( 'group', {
					name: new RegExp( property, 'i' ),
				} )
			);
			const unlink = control.queryByRole( 'button', {
				name: 'Unlink sides',
			} );
			if ( unlink ) {
				await userEvent.click( unlink );
			}
			await userEvent.fill(
				control.getByRole( 'textbox', { name: 'Left side' } ),
				'40'
			);
			await userEvent.keyboard( '{Enter}' );
			await expect
				.poll( () => getComputedStyle( preview )[ property ] )
				.toBe( '68px 32px 68px 40px' );
		}
	);
} );
