/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import RovingTabIndex from '../roving-tab-index';

describe( 'RovingTabIndex', () => {
	it( 'does not render any elements other than its children', () => {
		const renderer = TestRenderer.create(
			<RovingTabIndex>
				<div>child element</div>
			</RovingTabIndex>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );
} );
