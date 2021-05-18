/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import { SegmentedControl } from '../index';

describe( 'props', () => {
	const options = [
		{ value: 'olaf', label: 'O' },
		{ value: 'samantha', label: 'S' },
	];

	test( 'should render correctly', () => {
		let container;

		act( () => {
			const result = render(
				<SegmentedControl baseId="segmented" options={ options } />
			);
			container = result.container;
		} );

		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
