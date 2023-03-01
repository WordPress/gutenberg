/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import TreeGridRow from '../row';

describe( 'TreeGridRow', () => {
	it( 'renders a tr with support for level, positionInSet and setSize props', () => {
		const { container } = render(
			<table>
				<tbody>
					<TreeGridRow level={ 1 } positionInSet={ 1 } setSize={ 1 }>
						<td>Test</td>
					</TreeGridRow>
				</tbody>
			</table>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'forwards other props to the rendered tr element', () => {
		const { container } = render(
			<table>
				<tbody>
					<TreeGridRow
						className="my-row"
						level={ 1 }
						positionInSet={ 1 }
						setSize={ 1 }
					>
						<td>Test</td>
					</TreeGridRow>
				</tbody>
			</table>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
