/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import VisuallyHidden from '../';

describe( 'VisuallyHidden', () => {
	it( 'by default renders as a div with the visually hidden class name', () => {
		const renderer = TestRenderer.create(
			<VisuallyHidden>Test</VisuallyHidden>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );

	it( 'can be rendered as a different element using the `as` prop', () => {
		const renderer = TestRenderer.create(
			<VisuallyHidden as="span">Test</VisuallyHidden>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );

	it( 'forwards any additional props passed to the component to the rendered element', () => {
		const renderer = TestRenderer.create(
			<VisuallyHidden as="span" data-test="test">
				Test
			</VisuallyHidden>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );

	it( 'allows additional classnames to be specified, but retains the `components-visually-hidden` classname', () => {
		const renderer = TestRenderer.create(
			<VisuallyHidden as="span" className="test-component">
				Test
			</VisuallyHidden>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );
} );
