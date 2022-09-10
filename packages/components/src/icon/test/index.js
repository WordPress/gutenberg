/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Dashicon from '../../dashicon';
import Icon from '../';
import { Path, SVG } from '../../';

describe( 'Icon', () => {
	const testId = 'icon';
	const className = 'example-class';
	const svg = (
		<SVG>
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	);
	const style = { fill: 'red' };

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

	it( 'renders a function', () => {
		render( <Icon icon={ () => <span data-testid={ testId } /> } /> );

		expect( screen.getByTestId( testId ) ).toBeInTheDocument();
	} );

	it( 'renders an element', () => {
		render( <Icon icon={ <span data-testid={ testId } /> } /> );

		expect( screen.getByTestId( testId ) ).toBeInTheDocument();
	} );

	it( 'renders an svg element', () => {
		render( <Icon data-testid={ testId } icon={ svg } /> );

		expect( screen.getByTestId( testId ) ).toBeInTheDocument();
	} );

	it( 'renders an svg element with a default width and height of 24', () => {
		render( <Icon data-testid={ testId } icon={ svg } /> );
		const icon = screen.queryByTestId( testId );

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
		const icon = screen.queryByTestId( testId );

		expect( icon ).toHaveAttribute( 'width', '32' );
		expect( icon ).toHaveAttribute( 'height', '32' );
	} );

	it( 'renders an svg element and does not override width and height if already specified', () => {
		render( <Icon data-testid={ testId } icon={ svg } size={ 32 } /> );
		const icon = screen.queryByTestId( testId );

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

	describe( 'props passing', () => {
		const MyComponent = ( props ) => (
			<span className={ props.className } style={ props.style } />
		);

		describe.each( [
			[ 'dashicon', { icon: 'format-image' } ],
			[ 'dashicon element', { icon: <Dashicon icon="format-image" /> } ],
			[ 'element', { icon: <span /> } ],
			[ 'svg element', { icon: svg } ],
			[ 'component', { icon: MyComponent } ],
		] )( '%s', ( label, props ) => {
			it.skip( 'should pass through size', () => {
				if ( label === 'svg element' ) {
					// Custom logic for SVG elements tested separately.
					//
					// See: `renders an svg element and passes the size as its width and height`
					return;
				}

				if ( [ 'dashicon', 'dashicon element' ].includes( label ) ) {
					// `size` prop isn't passed through, since dashicon doesn't accept it.
					return;
				}

				const wrapper = shallow( <Icon { ...props } size={ 32 } /> );

				expect( wrapper.prop( 'size' ) ).toBe( 32 );
			} );

			it( 'should pass through all other props', () => {
				const { container } = render(
					<Icon
						{ ...props }
						style={ style }
						className={ className }
					/>
				);
				const icon = container.firstChild;

				expect( icon ).toHaveStyle( style );
				expect( icon ).toHaveClass( className );
			} );
		} );
	} );
} );
