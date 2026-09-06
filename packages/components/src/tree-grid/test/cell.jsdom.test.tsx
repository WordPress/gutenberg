/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
import { render, screen } from '@testing-library/react';
import { forwardRef } from '@wordpress/element';
import TreeGrid from '..';
import TreeGridCell from '../cell';

const TestButton = forwardRef(
	(
		{ ...props }: React.ComponentPropsWithoutRef< 'button' >,
		ref: React.ForwardedRef< HTMLButtonElement >
	) => <button { ...props } ref={ ref }></button>
);

describe( 'TreeGridCell', () => {
	it( 'throws outside a treegrid', () => {
		expect( () =>
			render(
				<table>
					<tbody>
						<tr>
							<TreeGridCell withoutGridItem>Test</TreeGridCell>
						</tr>
					</tbody>
				</table>
			)
		).toThrow(
			'TreeGridCell must be rendered as a cell in a row that belongs to an element with role="treegrid".'
		);
		expect( console ).toHaveErrored();
	} );

	it( 'supports a custom semantic treegrid structure without a TreeGrid parent', () => {
		render(
			<table role="treegrid">
				<tbody>
					<tr>
						<TreeGridCell withoutGridItem>Test</TreeGridCell>
					</tr>
				</tbody>
			</table>
		);

		expect( screen.getByRole( 'gridcell' ) ).toHaveTextContent( 'Test' );
	} );

	it( 'uses a child render function to render children', () => {
		const { container } = render(
			<TreeGrid>
				<tr>
					<TreeGridCell>
						{ ( props ) => (
							<TestButton className="my-button" { ...props }>
								Click Me!
							</TestButton>
						) }
					</TreeGridCell>
				</tr>
			</TreeGrid>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
/* eslint-enable jsx-a11y/no-noninteractive-element-to-interactive-role */
