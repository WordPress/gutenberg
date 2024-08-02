/**
 * External dependencies
 */

import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import { Surface } from '../index';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

describe( 'props', () => {
	test( 'should render correctly', async () => {
		const container = createContainer();
		await render( <Surface>Surface</Surface>, { container } );
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render variants', async () => {
		const container = createContainer();
		await render( <Surface>Surface</Surface>, { container } );
		const container2 = createContainer();
		render( <Surface variant="secondary">Surface</Surface>, {
			container: container2,
		} );
		expect( container2 ).toMatchDiffSnapshot( container );
	} );

	test( 'should render borderLeft', async () => {
		const container = createContainer();
		await render( <Surface>Surface</Surface>, { container } );
		const container2 = createContainer();
		render( <Surface borderLeft>Surface</Surface>, {
			container: container2,
		} );
		expect( container2 ).toMatchDiffSnapshot( container );
	} );

	test( 'should render borderRight', async () => {
		const container = createContainer();
		await render( <Surface>Surface</Surface>, { container } );
		const container2 = createContainer();
		render( <Surface borderRight>Surface</Surface>, {
			container: container2,
		} );
		expect( container2 ).toMatchDiffSnapshot( container );
	} );

	test( 'should render borderTop', async () => {
		const container = createContainer();
		await render( <Surface>Surface</Surface>, { container } );
		const container2 = createContainer();
		render( <Surface borderTop>Surface</Surface>, {
			container: container2,
		} );
		expect( container2 ).toMatchDiffSnapshot( container );
	} );

	test( 'should render borderBottom', async () => {
		const container = createContainer();
		await render( <Surface>Surface</Surface>, { container } );
		const container2 = createContainer();
		render( <Surface borderBottom>Surface</Surface>, {
			container: container2,
		} );
		expect( container2 ).toMatchDiffSnapshot( container );
	} );
} );
