import { describe, expect, it } from 'vitest';
/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
import { render, screen } from '@testing-library/react';
import { createPortal, forwardRef, useId } from '@wordpress/element';
import TreeGrid from '..';
import TreeGridCell from '../cell';
import TreeGridRow from '../row';

const TestButton = forwardRef(
	(
		{ ...props }: React.ComponentPropsWithoutRef< 'button' >,
		ref: React.ForwardedRef< HTMLButtonElement >
	) => <button { ...props } ref={ ref }></button>
);

describe( 'TreeGridCell', () => {
	it( 'throws outside a treegrid', () => {
		expect( () =>
			render(
				<table>
					<tbody>
						<tr>
							<TreeGridCell withoutGridItem>Test</TreeGridCell>
						</tr>
					</tbody>
				</table>
			)
		).toThrow(
			'TreeGridCell must be rendered as a cell in a row that belongs to an element with role="treegrid".'
		);
		expect( console ).toHaveErrored();
	} );

	it( 'supports a custom semantic treegrid structure without a TreeGrid parent', () => {
		render(
			<table role="treegrid">
				<tbody>
					<tr>
						<TreeGridCell withoutGridItem>Test</TreeGridCell>
					</tr>
				</tbody>
			</table>
		);

		expect( screen.getByRole( 'gridcell' ) ).toHaveTextContent( 'Test' );
	} );

	it( 'accepts a cell explicitly owned by a valid treegrid row', () => {
		const portalTable = document.createElement( 'table' );
		const portalBody = document.createElement( 'tbody' );
		const portalRow = document.createElement( 'tr' );
		portalRow.setAttribute( 'role', 'presentation' );
		portalBody.append( portalRow );
		portalTable.append( portalBody );
		document.body.append( portalTable );

		function AriaOwnedCell() {
			const cellId = useId();

			return (
				<TreeGrid>
					<TreeGridRow
						level={ 1 }
						positionInSet={ 1 }
						setSize={ 1 }
						aria-owns={ cellId }
					>
						{ createPortal(
							<TreeGridCell id={ cellId } withoutGridItem>
								Test
							</TreeGridCell>,
							portalRow
						) }
					</TreeGridRow>
				</TreeGrid>
			);
		}

		try {
			render( <AriaOwnedCell /> );

			expect( screen.getByRole( 'gridcell' ) ).toHaveTextContent(
				'Test'
			);
		} finally {
			portalTable.remove();
		}
	} );

	it( 'accepts a cell inside a wrapper explicitly owned by a valid treegrid row', () => {
		const portalTable = document.createElement( 'table' );
		const portalBody = document.createElement( 'tbody' );
		portalTable.append( portalBody );
		document.body.append( portalTable );

		function AriaOwnedCellWrapper() {
			const wrapperId = useId();

			return (
				<TreeGrid>
					<TreeGridRow
						level={ 1 }
						positionInSet={ 1 }
						setSize={ 1 }
						aria-owns={ wrapperId }
					>
						{ createPortal(
							<tr id={ wrapperId } role="presentation">
								<TreeGridCell withoutGridItem>
									Test
								</TreeGridCell>
							</tr>,
							portalBody
						) }
					</TreeGridRow>
				</TreeGrid>
			);
		}

		try {
			render( <AriaOwnedCellWrapper /> );

			expect( screen.getByRole( 'gridcell' ) ).toHaveTextContent(
				'Test'
			);
		} finally {
			portalTable.remove();
		}
	} );

	it( 'uses a child render function to render children', () => {
		const { container } = render(
			<TreeGrid>
				<tr>
					<TreeGridCell>
						{ ( props ) => (
							<TestButton className="my-button" { ...props }>
								Click Me!
							</TestButton>
						) }
					</TreeGridCell>
				</tr>
			</TreeGrid>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
/* eslint-enable jsx-a11y/no-noninteractive-element-to-interactive-role */
