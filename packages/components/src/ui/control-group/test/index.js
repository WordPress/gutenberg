/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ControlGroup } from '..';
import Button from '../../../button';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<ControlGroup>
				<Button>Code is Poetry</Button>
				<Button>WordPress.org</Button>
			</ControlGroup>
		);
		expect( container ).toMatchSnapshot();
	} );
} );
