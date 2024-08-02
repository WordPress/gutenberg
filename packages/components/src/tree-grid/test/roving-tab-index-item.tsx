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
import RovingTabIndex from '../roving-tab-index';
import RovingTabIndexItem from '../roving-tab-index-item';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

const TestButton = forwardRef(
	(
		{ ...props }: React.ComponentPropsWithoutRef< 'button' >,
		ref: React.ForwardedRef< HTMLButtonElement >
	) => <button { ...props } ref={ ref }></button>
);

describe( 'RovingTabIndexItem', () => {
	it( 'requires RovingTabIndex to be declared as a parent component somewhere in the component hierarchy', async () => {
		await expect( () =>
			render( <RovingTabIndexItem as={ TestButton } /> )
		).rejects.toThrow();
		expect( console ).toHaveErrored();
	} );

	it( 'allows another component to be specified as the rendered component using the `as` prop', async () => {
		const container = createContainer();
		await render(
			<RovingTabIndex>
				<RovingTabIndexItem as={ TestButton } />
			</RovingTabIndex>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'forwards props to the `as` component', async () => {
		const container = createContainer();
		await render(
			<RovingTabIndex>
				<RovingTabIndexItem as={ TestButton } className="my-button">
					Click Me!
				</RovingTabIndexItem>
			</RovingTabIndex>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'allows children to be declared using a child render function as an alternative to `as`', async () => {
		const container = createContainer();
		await render(
			<RovingTabIndex>
				<RovingTabIndexItem>
					{ ( props: React.ComponentProps< typeof TestButton > ) => (
						<TestButton className="my-button" { ...props }>
							Click Me!
						</TestButton>
					) }
				</RovingTabIndexItem>
			</RovingTabIndex>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );
} );
