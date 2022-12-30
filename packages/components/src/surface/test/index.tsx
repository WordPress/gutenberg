/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Surface } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <Surface>Surface</Surface> );
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render variants', () => {
		const view = render( <Surface>Surface</Surface> );
		const { container } = render(
			<Surface variant="secondary">Surface</Surface>
		);
		expect( container ).toMatchDiffSnapshot( view.container );
	} );

	test( 'should render borderLeft', () => {
		const view = render( <Surface>Surface</Surface> );
		const { container } = render( <Surface borderLeft>Surface</Surface> );
		expect( container ).toMatchDiffSnapshot( view.container );
	} );

	test( 'should render borderRight', () => {
		const view = render( <Surface>Surface</Surface> );
		const { container } = render( <Surface borderRight>Surface</Surface> );
		expect( container ).toMatchDiffSnapshot( view.container );
	} );

	test( 'should render borderTop', () => {
		const view = render( <Surface>Surface</Surface> );
		const { container } = render( <Surface borderTop>Surface</Surface> );
		expect( container ).toMatchDiffSnapshot( view.container );
	} );

	test( 'should render borderBottom', () => {
		const view = render( <Surface>Surface</Surface> );
		const { container } = render( <Surface borderBottom>Surface</Surface> );
		expect( container ).toMatchDiffSnapshot( view.container );
	} );
} );
