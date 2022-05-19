/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGrid from '../';
import TreeGridCell from '../cell';

const TestButton = forwardRef( ( { ...props }, ref ) => (
	<button { ...props } ref={ ref }></button>
) );

describe( 'TreeGridCell', () => {
	it( 'requires TreeGrid to be declared as a parent component somewhere in the component hierarchy', () => {
		expect( () =>
			TestRenderer.create(
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
		const renderer = TestRenderer.create(
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

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );
} );
