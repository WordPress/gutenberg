/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import Interpolate from '../interpolate';

describe( 'Interpolate', () => {
	it( 'renders expected result from component', () => {
		const TestComponent = () => {
			const image = <img alt={ 'An test' } src={ '/file' } />;
			const url = 'https://example.org';
			return <Interpolate
				extra={ 'and fries' }
				foo={ 'bar' }
				image={ image }
			>
				This is an awesome cheeseburger %%extra%%! Go <a href={ url }>here</a> to eat at the %%foo%%.
			</Interpolate>;
		};
		const tree = TestRenderer
			.create( <TestComponent /> )
			.toJSON();
		expect( tree ).toMatchSnapshot();
	} );
} );
