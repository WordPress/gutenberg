/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import TreeGrid from '../';

describe( 'TreeGrid', () => {
	it( 'renders a table, tbody and any child elements', () => {
		const renderer = TestRenderer.create(
			<TreeGrid>
				<tr>
					<td>Test</td>
				</tr>
			</TreeGrid>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );
} );
