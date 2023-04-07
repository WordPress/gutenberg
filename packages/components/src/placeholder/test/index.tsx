/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { SVG, Path } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import BasePlaceholder from '../';
import type { WordPressComponentProps } from '../../ui/context';
import type { PlaceholderProps } from '../types';

jest.mock( '@wordpress/compose', () => {
	return {
		...jest.requireActual( '@wordpress/compose' ),
		useResizeObserver: jest.fn( () => [] ),
	};
} );

/**
 * Test icon that can be queried by `getByTestId`
 */
const testIcon = (
	<SVG data-testid="icon">
		<Path />
	</SVG>
);

const Placeholder = (
	props: Omit<
		WordPressComponentProps< PlaceholderProps, 'div', false >,
		'ref'
	>
) => <BasePlaceholder data-testid="placeholder" { ...props } />;

const getPlaceholder = () => screen.getByTestId( 'placeholder' );

describe( 'Placeholder', () => {
	beforeEach( () => {
		// @ts-ignore
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

			// Test for empty label. When the label is empty, the only way to
			// query the div is with `querySelector`.
			// eslint-disable-next-line testing-library/no-node-access
			const label = placeholder.querySelector(
				'.components-placeholder__label'
			);
			expect( label ).toBeInTheDocument();
			expect( label ).toBeEmptyDOMElement();

			// Test for non existent instructions. When the instructions is
			// empty, the only way to query the div is with `querySelector`.
			// eslint-disable-next-line testing-library/no-node-access
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
			render( <Placeholder icon={ testIcon } /> );

			const placeholder = getPlaceholder();
			const icon = within( placeholder ).getByTestId( 'icon' );
			// eslint-disable-next-line testing-library/no-node-access
			expect( icon.parentNode ).toHaveClass(
				'components-placeholder__label'
			);
			expect( icon ).toBeInTheDocument();
		} );

		it( 'should render a label section', () => {
			const label = 'WordPress';
			render( <Placeholder label={ label } /> );
			const placeholderLabel = screen.getByText( label );

			expect( placeholderLabel ).toHaveClass(
				'components-placeholder__label'
			);
			expect( placeholderLabel ).toBeInTheDocument();
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
			const captionedFieldset = screen.getByRole( 'group', {
				name: instructions,
			} );

			expect( captionedFieldset ).toBeInTheDocument();
		} );

		it( 'should add an additional className to the top container', () => {
			render( <Placeholder className="wp-placeholder" /> );
			const placeholder = getPlaceholder();

			expect( placeholder ).toHaveClass( 'components-placeholder' );
			expect( placeholder ).toHaveClass( 'wp-placeholder' );
		} );

		it( 'should add additional props to the top level container', () => {
			render( <Placeholder data-test="test" /> );
			const placeholder = getPlaceholder();

			expect( placeholder ).toHaveAttribute( 'data-test', 'test' );
		} );
	} );

	describe( 'resize aware', () => {
		it( 'should not assign modifier class in first-pass `null` width from `useResizeObserver`', () => {
			// @ts-ignore
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
			// @ts-ignore
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
