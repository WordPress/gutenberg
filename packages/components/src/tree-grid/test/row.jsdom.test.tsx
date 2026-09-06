/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
import { render } from '@testing-library/react';
import TreeGridRow from '../row';

describe( 'TreeGridRow', () => {
	it( 'throws outside a treegrid', () => {
		expect( () =>
			render(
				<table>
					<tbody>
						<TreeGridRow
							level={ 1 }
							positionInSet={ 1 }
							setSize={ 1 }
						>
							<td>Test</td>
						</TreeGridRow>
					</tbody>
				</table>
			)
		).toThrow(
			'TreeGridRow must be rendered inside an element with role="treegrid".'
		);
		expect( console ).toHaveErrored();
	} );

	it( 'renders a tr with support for level, positionInSet and setSize props', () => {
		const { container } = render(
			<table role="treegrid">
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
			<table role="treegrid">
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
/* eslint-enable jsx-a11y/no-noninteractive-element-to-interactive-role */
