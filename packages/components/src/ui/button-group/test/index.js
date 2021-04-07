/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Button } from '../../button';
import { ButtonGroup } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<ButtonGroup baseId="ButtonGroup">
				<Button value="code">Code</Button>
				<Button value="is">is</Button>
				<Button value="poetry">Poetry</Button>
			</ButtonGroup>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
