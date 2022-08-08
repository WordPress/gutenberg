/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { more } from '@wordpress/icons';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BasePlaceholder from '../';

jest.mock( '@wordpress/compose', () => {
	return {
		...jest.requireActual( '@wordpress/compose' ),
		useResizeObserver: jest.fn( () => [] ),
	};
} );

const Placeholder = ( props ) => (
	<BasePlaceholder data-testid="placeholder" { ...props } />
);

const getPlaceholder = () => screen.getByTestId( 'placeholder' );

const getLabel = () => {
	const placeholder = getPlaceholder();
	return placeholder.querySelector( '.components-placeholder__label' );
};

describe( 'Placeholder', () => {
	beforeEach( () => {
		useResizeObserver.mockReturnValue( [
			<div key="1" />,
			{ width: 320 },
		] );
	} );

	describe( 'basic rendering', () => {
		it( 'should by default render label section and fieldset.', () => {
			render( <Placeholder /> );
			const placeholder = getPlaceholder();

			expect( placeholder ).toHaveClass( 'components-placeholder' );

			// Test for empty label.
			const label = getLabel();
			expect( label ).toBeInTheDocument();
			expect( label ).toBeEmptyDOMElement();

			// Test for non existent instructions.
			const placeholderInstructions = placeholder.querySelector(
				'.components-placeholder__instructions'
			);
			expect( placeholderInstructions ).not.toBeInTheDocument();

			// Test for empty fieldset.
			const placeholderFieldset =
				within( placeholder ).getByRole( 'group' );
			expect( placeholderFieldset ).toBeInTheDocument();
			expect( placeholderFieldset ).toBeEmptyDOMElement();
		} );

		it( 'should render an Icon in the label section', () => {
			render( <Placeholder icon={ more } /> );
			const icon = getLabel()?.querySelector( 'svg' );

			expect( icon ).toBeInTheDocument();
		} );

		it( 'should render a label section', () => {
			const label = 'WordPress';
			render( <Placeholder label={ label } /> );
			const placeholderLabel = getLabel();

			expect( placeholderLabel ).toHaveTextContent( label );
		} );

		it( 'should display an instructions element', () => {
			const element = <div data-testid="instructions">Instructions</div>;
			render( <Placeholder instructions={ element } /> );
			const placeholderInstructions =
				screen.getByTestId( 'instructions' );

			expect( placeholderInstructions ).toBeInTheDocument();
		} );

		it( 'should display a fieldset from the children property', () => {
			const content = 'Fieldset';
			render( <Placeholder>{ content }</Placeholder> );
			const placeholderFieldset = screen.getByRole( 'group' );

			expect( placeholderFieldset ).toBeInTheDocument();
			expect( placeholderFieldset ).toHaveTextContent( content );
		} );

		it( 'should display a legend if instructions are passed', () => {
			const instructions = 'Choose an option.';
			render(
				<Placeholder instructions={ instructions }>
					<div>Fieldset</div>
				</Placeholder>
			);
			const placeholderLegend = screen.getByText( instructions );

			expect( placeholderLegend ).toBeInTheDocument();
			expect( placeholderLegend.tagName ).toBe( 'LEGEND' );
		} );

		it( 'should add an additional className to the top container', () => {
			render( <Placeholder className="wp-placeholder" /> );
			const placeholder = getPlaceholder();

			expect( placeholder ).toHaveClass( 'wp-placeholder' );
		} );

		it( 'should add additional props to the top level container', () => {
			render( <Placeholder test="test" /> );
			const placeholder = getPlaceholder();

			expect( placeholder ).toHaveAttribute( 'test', 'test' );
		} );
	} );

	describe( 'resize aware', () => {
		it( 'should not assign modifier class in first-pass `null` width from `useResizeObserver`', () => {
			useResizeObserver.mockReturnValue( [
				<div key="1" />,
				{ width: 480 },
			] );

			render( <Placeholder /> );
			const placeholder = getPlaceholder();

			expect( placeholder ).toHaveClass( 'is-large' );
			expect( placeholder ).not.toHaveClass( 'is-medium' );
			expect( placeholder ).not.toHaveClass( 'is-small' );
		} );

		it( 'should assign modifier class', () => {
			useResizeObserver.mockReturnValue( [
				<div key="1" />,
				{ width: null },
			] );

			render( <Placeholder /> );
			const placeholder = getPlaceholder();

			expect( placeholder ).not.toHaveClass( 'is-large' );
			expect( placeholder ).not.toHaveClass( 'is-medium' );
			expect( placeholder ).not.toHaveClass( 'is-small' );
		} );
	} );
} );
