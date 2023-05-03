/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGrid from '..';
import TreeGridCell from '../cell';

const TestButton = forwardRef(
	(
		{ ...props }: React.ComponentPropsWithoutRef< 'button' >,
		ref: React.ForwardedRef< HTMLButtonElement >
	) => <button { ...props } ref={ ref }></button>
);

describe( 'TreeGridCell', () => {
	it( 'requires TreeGrid to be declared as a parent component somewhere in the component hierarchy', () => {
		expect( () =>
			render(
				<TreeGridCell>
					{ ( props ) => (
						<TestButton className="my-button" { ...props }>
							Click Me!
						</TestButton>
					) }
				</TreeGridCell>
			)
		).toThrow();
		expect( console ).toHaveErrored();
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
