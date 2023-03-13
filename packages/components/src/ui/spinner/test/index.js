/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Spinner } from '..';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <Spinner /> );
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render color', () => {
		const { container } = render( <Spinner /> );
		const { container: secondRenderContainer } = render(
			<Spinner color="blue" />
		);
		expect( secondRenderContainer ).toMatchDiffSnapshot( container );
	} );

	test( 'should render size', () => {
		const { container } = render( <Spinner /> );
		const { container: secondRenderContainer } = render(
			<Spinner size={ 31 } />
		);
		expect( secondRenderContainer ).toMatchDiffSnapshot( container );
	} );
} );
