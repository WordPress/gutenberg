import { render } from '@testing-library/react';
import RovingTabIndex from '../roving-tab-index';

describe( 'RovingTabIndex', () => {
	it( 'does not render any elements other than its children', () => {
		const { container } = render(
			<RovingTabIndex>
				<div>child element</div>
			</RovingTabIndex>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
