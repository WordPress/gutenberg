/**
 * External dependencies
 */

import { render } from '@ariakit/test/react';

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
	it( 'requires TreeGrid to be declared as a parent component somewhere in the component hierarchy', async () => {
		await expect( () =>
			render(
				<TreeGridCell>
					{ ( props ) => (
						<TestButton className="my-button" { ...props }>
							Click Me!
						</TestButton>
					) }
				</TreeGridCell>
			)
		).rejects.toThrow();
		expect( console ).toHaveErrored();
	} );

	it( 'uses a child render function to render children', async () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		await render(
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
			</TreeGrid>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );
} );
