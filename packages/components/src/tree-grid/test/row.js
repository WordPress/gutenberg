/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import TreeGridRow from '../row';

describe( 'TreeGridRow', () => {
	it( 'renders a tr with support for level, positionInSet and setSize props', () => {
		const renderer = TestRenderer.create(
			<table>
				<TreeGridRow level="1" positionInSet="1" setSize="1">
					<td>Test</td>
				</TreeGridRow>
			</table>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );

	it( 'forwards other props to the rendered tr element', () => {
		const renderer = TestRenderer.create(
			<table>
				<TreeGridRow
					className="my-row"
					level="1"
					positionInSet="1"
					setSize="1"
				>
					<td>Test</td>
				</TreeGridRow>
			</table>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );
} );
