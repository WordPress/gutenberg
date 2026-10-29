import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import Icon from '..';
import check from '../../library/check';

describe( 'Icon', () => {
	it.each( [ 16, 20, 24 ] )(
		'renders library icons with scaling strokes at %ipx',
		async ( size ) => {
			await render(
				<Icon icon={ check } size={ size } data-testid="scaled-icon" />
			);

			const icon = screen.getByTestId( 'scaled-icon' );
			// SVG stroke geometry has no Testing Library query.
			// eslint-disable-next-line testing-library/no-node-access
			const shape = icon.querySelector( 'path' )!;
			const scale = shape.getScreenCTM()!;

			expect( icon.getBoundingClientRect().width ).toBe( size );
			expect( icon.getBoundingClientRect().height ).toBe( size );
			expect( shape ).toHaveStyle( 'vector-effect: none' );
			expect(
				parseFloat( getComputedStyle( shape ).strokeWidth ) * scale.a
			).toBeCloseTo( ( 1.5 * size ) / 24 );
		}
	);

	it( "merges consumer styles with the icon's intrinsic styles", async () => {
		await render(
			<Icon
				icon={ <svg style={ { fill: 'none', opacity: 0.5 } } /> }
				data-testid="test-icon"
				style={ { marginInlineStart: 4, opacity: 1 } }
			/>
		);

		const icon = screen.getByTestId( 'test-icon' );
		expect( icon ).toHaveStyle( 'fill: none' );
		expect( icon ).toHaveStyle( 'opacity: 1' );
		expect( icon ).toHaveStyle( 'margin-inline-start: 4px' );
	} );

	it( "does not add a 'style' prop when neither side defines one", async () => {
		let hasStyleProp = true;
		const CustomIcon = ( props: Record< string, unknown > ) => {
			hasStyleProp = 'style' in props;
			return <svg data-testid="test-icon" />;
		};

		await render( <Icon icon={ <CustomIcon /> } /> );

		expect( screen.getByTestId( 'test-icon' ) ).toBeVisible();
		expect( hasStyleProp ).toBe( false );
	} );
} );
