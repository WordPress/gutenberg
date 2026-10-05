import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { Path, SVG } from '@wordpress/primitives';
import Icon from '..';

describe( 'Icon', () => {
	const testId = 'icon';
	const className = 'example-class';
	const svg = (
		<SVG>
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	);

	it( 'renders nothing when icon omitted', async () => {
		await render( <Icon data-testid={ testId } /> );

		expect( screen.queryByTestId( testId ) ).not.toBeInTheDocument();
	} );

	it( 'renders a dashicon by slug', async () => {
		await render( <Icon data-testid={ testId } icon="format-image" /> );

		expect( screen.getByTestId( testId ) ).toHaveClass(
			'dashicons-format-image'
		);
	} );

	it( 'renders a dashicon with custom size', async () => {
		await render(
			<Icon data-testid={ testId } icon="format-image" size={ 10 } />
		);

		const style = getComputedStyle( screen.getByTestId( testId ) );
		expect( style.width ).toBe( '10px' );
		expect( style.height ).toBe( '10px' );
		expect( style.fontSize ).toBe( '10px' );
	} );

	it( 'renders a function', async () => {
		await render( <Icon icon={ () => <span data-testid={ testId } /> } /> );

		expect( screen.getByTestId( testId ) ).toBeVisible();
	} );

	it( 'renders an element', async () => {
		await render( <Icon icon={ <span data-testid={ testId } /> } /> );

		expect( screen.getByTestId( testId ) ).toBeVisible();
	} );

	it( 'renders an svg element', async () => {
		await render( <Icon data-testid={ testId } icon={ svg } /> );

		expect( screen.getByTestId( testId ) ).toBeVisible();
	} );

	it( 'renders an svg element with a default width and height of 24', async () => {
		await render( <Icon data-testid={ testId } icon={ svg } /> );
		const icon = screen.getByTestId( testId );

		expect( icon ).toHaveAttribute( 'width', '24' );
		expect( icon ).toHaveAttribute( 'height', '24' );
	} );

	it( 'renders an svg element and override its width and height', async () => {
		await render(
			<Icon
				data-testid={ testId }
				icon={
					<SVG width={ 64 } height={ 64 }>
						<Path d="M5 4v3h5.5v12h3V7H19V4z" />
					</SVG>
				}
				size={ 32 }
			/>
		);
		const icon = screen.getByTestId( testId );

		expect( icon ).toHaveAttribute( 'width', '32' );
		expect( icon ).toHaveAttribute( 'height', '32' );
	} );

	it( 'renders an svg element and does not override width and height if already specified', async () => {
		await render(
			<Icon data-testid={ testId } icon={ svg } size={ 32 } />
		);
		const icon = screen.getByTestId( testId );

		expect( icon ).toHaveAttribute( 'width', '32' );
		expect( icon ).toHaveAttribute( 'height', '32' );
	} );

	it( 'renders a component', async () => {
		const MyComponent = () => (
			<span data-testid={ testId } className={ className } />
		);

		await render( <Icon icon={ MyComponent } /> );

		expect( screen.getByTestId( testId ) ).toHaveClass( className );
	} );

	it( "merges a consumer 'style' prop with the icon's intrinsic style", async () => {
		const strokeIcon = (
			<SVG style={ { fill: 'none' } }>
				<Path d="M5 4v3h5.5v12h3V7H19V4z" />
			</SVG>
		);

		await render(
			<Icon
				data-testid={ testId }
				icon={ strokeIcon }
				style={ { marginInlineStart: 4 } }
			/>
		);
		const icon = screen.getByTestId( testId );

		// The icon's intrinsic `fill: none` survives…
		expect( icon ).toHaveStyle( 'fill: none' );
		// …alongside the consumer-supplied style.
		expect( icon ).toHaveStyle( 'margin-inline-start: 4px' );
	} );

	it( "lets a consumer 'style' override the icon's intrinsic style", async () => {
		const strokeIcon = (
			<SVG style={ { fill: 'none' } }>
				<Path d="M5 4v3h5.5v12h3V7H19V4z" />
			</SVG>
		);

		await render(
			<Icon
				data-testid={ testId }
				icon={ strokeIcon }
				style={ { fill: 'red' } }
			/>
		);

		expect( screen.getByTestId( testId ) ).toHaveStyle( {
			fill: 'rgb(255, 0, 0)',
		} );
	} );

	it( "merges a consumer 'style' with a non-svg element's intrinsic style", async () => {
		await render(
			<Icon
				icon={
					<span data-testid={ testId } style={ { fill: 'none' } } />
				}
				style={ { marginInlineStart: 4 } }
			/>
		);
		const icon = screen.getByTestId( testId );

		expect( icon ).toHaveStyle( 'fill: none' );
		expect( icon ).toHaveStyle( 'margin-inline-start: 4px' );
	} );

	it( "does not add a 'style' prop to a non-svg element without styles", async () => {
		let hasStyleProp = true;
		const CustomIcon = ( props: Record< string, unknown > ) => {
			hasStyleProp = 'style' in props;
			return <span data-testid={ testId } />;
		};

		await render( <Icon icon={ <CustomIcon /> } /> );

		expect( screen.getByTestId( testId ) ).toBeVisible();
		expect( hasStyleProp ).toBe( false );
	} );
} );
