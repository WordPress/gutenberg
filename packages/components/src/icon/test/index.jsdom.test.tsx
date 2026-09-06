import { render, screen } from '@testing-library/react';
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

	it( 'renders nothing when icon omitted', () => {
		render( <Icon data-testid={ testId } /> );

		expect( screen.queryByTestId( testId ) ).not.toBeInTheDocument();
	} );

	it( 'renders a dashicon by slug', () => {
		render( <Icon data-testid={ testId } icon="format-image" /> );

		expect( screen.getByTestId( testId ) ).toHaveClass(
			'dashicons-format-image'
		);
	} );

	it( 'renders a dashicon with custom size', () => {
		render(
			<Icon data-testid={ testId } icon="format-image" size={ 10 } />
		);

		expect( screen.getByTestId( testId ) ).toHaveStyle( 'width:10px' );
		expect( screen.getByTestId( testId ) ).toHaveStyle( 'height:10px' );
		expect( screen.getByTestId( testId ) ).toHaveStyle( 'font-size:10px' );
	} );

	it( 'renders a function', () => {
		render( <Icon icon={ () => <span data-testid={ testId } /> } /> );

		expect( screen.getByTestId( testId ) ).toBeVisible();
	} );

	it( 'renders an element', () => {
		render( <Icon icon={ <span data-testid={ testId } /> } /> );

		expect( screen.getByTestId( testId ) ).toBeVisible();
	} );

	it( 'renders an svg element', () => {
		render( <Icon data-testid={ testId } icon={ svg } /> );

		expect( screen.getByTestId( testId ) ).toBeVisible();
	} );

	it( 'renders an svg element with a default width and height of 24', () => {
		render( <Icon data-testid={ testId } icon={ svg } /> );
		const icon = screen.getByTestId( testId );

		expect( icon ).toHaveAttribute( 'width', '24' );
		expect( icon ).toHaveAttribute( 'height', '24' );
	} );

	it( 'renders an svg element and override its width and height', () => {
		render(
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

	it( 'renders an svg element and does not override width and height if already specified', () => {
		render( <Icon data-testid={ testId } icon={ svg } size={ 32 } /> );
		const icon = screen.getByTestId( testId );

		expect( icon ).toHaveAttribute( 'width', '32' );
		expect( icon ).toHaveAttribute( 'height', '32' );
	} );

	it( 'renders a component', () => {
		const MyComponent = () => (
			<span data-testid={ testId } className={ className } />
		);
		render( <Icon icon={ MyComponent } /> );

		expect( screen.getByTestId( testId ) ).toHaveClass( className );
	} );

	it( "merges a consumer 'style' prop with the icon's intrinsic style", () => {
		const strokeIcon = (
			<SVG style={ { fill: 'none' } }>
				<Path d="M5 4v3h5.5v12h3V7H19V4z" />
			</SVG>
		);
		render(
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

	it( "lets a consumer 'style' override the icon's intrinsic style", () => {
		const strokeIcon = (
			<SVG style={ { fill: 'none' } }>
				<Path d="M5 4v3h5.5v12h3V7H19V4z" />
			</SVG>
		);
		render(
			<Icon
				data-testid={ testId }
				icon={ strokeIcon }
				style={ { fill: 'red' } }
			/>
		);

		expect( screen.getByTestId( testId ) ).toHaveStyle( 'fill: red' );
	} );

	it( "merges a consumer 'style' with a non-svg element's intrinsic style", () => {
		render(
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

	it( "does not add a 'style' prop to a non-svg element without styles", () => {
		let hasStyleProp = true;
		const CustomIcon = ( props: Record< string, unknown > ) => {
			hasStyleProp = 'style' in props;
			return <span data-testid={ testId } />;
		};

		render( <Icon icon={ <CustomIcon /> } /> );

		expect( screen.getByTestId( testId ) ).toBeVisible();
		expect( hasStyleProp ).toBe( false );
	} );
} );
