/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { AspectRatio } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<AspectRatio>
				<img alt="Snow" />
			</AspectRatio>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render with custom ratio', () => {
		const { container } = render(
			<AspectRatio ratio={ 16 / 9 }>
				<img alt="Snow" />
			</AspectRatio>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render with custom width', () => {
		const { container } = render(
			<AspectRatio ratio={ 21 / 9 } width={ 320 }>
				<img alt="Snow" />
			</AspectRatio>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
