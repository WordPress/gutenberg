/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { Button, Select, TextInput } from '@wp-g2/components';

/**
 * Internal dependencies
 */
import { ControlGroup } from '..';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<ControlGroup>
				<Button>Lorem</Button>
				<Button>Ipsum</Button>
			</ControlGroup>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render mixed control types', () => {
		/* eslint-disable no-restricted-syntax */
		const { container } = render(
			<ControlGroup>
				<Select id="salutations" />
				<TextInput id="fname" />
				<Button>Lorem</Button>
			</ControlGroup>
		);
		/* eslint-enable no-restricted-syntax */
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
