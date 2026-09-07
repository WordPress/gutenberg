/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
import { render, screen } from '@testing-library/react';
import { createPortal, useId } from '@wordpress/element';
import TreeGridRow from '../row';
import TreeGrid from '..';

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

	it( 'accepts a row explicitly owned by the treegrid', () => {
		const portalTable = document.createElement( 'table' );
		const portalBody = document.createElement( 'tbody' );
		portalTable.append( portalBody );
		document.body.append( portalTable );

		function AriaOwnedRow() {
			const rowId = useId();

			return (
				<TreeGrid aria-owns={ rowId }>
					{ createPortal(
						<TreeGridRow
							id={ rowId }
							level={ 1 }
							positionInSet={ 1 }
							setSize={ 1 }
						>
							<td>Test</td>
						</TreeGridRow>,
						portalBody
					) }
				</TreeGrid>
			);
		}

		try {
			render( <AriaOwnedRow /> );

			expect( screen.getByRole( 'row' ) ).toHaveTextContent( 'Test' );
		} finally {
			portalTable.remove();
		}
	} );

	it( 'accepts a row inside a rowgroup explicitly owned by the treegrid', () => {
		const portalTable = document.createElement( 'table' );
		document.body.append( portalTable );

		function AriaOwnedRowGroup() {
			const rowGroupId = useId();

			return (
				<TreeGrid aria-owns={ rowGroupId }>
					{ createPortal(
						<tbody id={ rowGroupId }>
							<TreeGridRow
								level={ 1 }
								positionInSet={ 1 }
								setSize={ 1 }
							>
								<td>Test</td>
							</TreeGridRow>
						</tbody>,
						portalTable
					) }
				</TreeGrid>
			);
		}

		try {
			render( <AriaOwnedRowGroup /> );

			expect( screen.getByRole( 'row' ) ).toHaveTextContent( 'Test' );
		} finally {
			portalTable.remove();
		}
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
