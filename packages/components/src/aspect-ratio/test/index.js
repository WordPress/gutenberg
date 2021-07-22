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

	test( 'should add different ratio when provided', () => {
		const { container: withRatio } = render(
			<AspectRatio ratio={ 21 / 9 }>
				<img alt="Snow" />
			</AspectRatio>
		);
		const { container: defaultRatio } = render(
			<AspectRatio>
				<img alt="Snow" />
			</AspectRatio>
		);
		expect( withRatio.firstChild ).toMatchDiffSnapshot(
			defaultRatio.firstChild
		);
	} );

	test( 'should add different width when provided', () => {
		const { container: withWidth } = render(
			<AspectRatio ratio={ 21 / 9 } width={ '320px' }>
				<img alt="Snow" />
			</AspectRatio>
		);
		const { container: defaultWidth } = render(
			<AspectRatio ratio={ 21 / 9 }>
				<img alt="Snow" />
			</AspectRatio>
		);
		expect( withWidth.firstChild ).toMatchDiffSnapshot(
			defaultWidth.firstChild
		);
	} );
} );
