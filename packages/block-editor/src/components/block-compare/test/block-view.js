/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import BlockView from '../block-view';

const noop = () => {};

describe( 'BlockView', () => {
	test( 'should match snapshot', () => {
		const { container } = render(
			<BlockView
				title="title"
				rawContent="raw"
				renderedContent="render"
				action={ noop }
				actionText="action"
				className="class"
			/>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
