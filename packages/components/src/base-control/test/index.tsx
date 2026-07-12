/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import BaseControl from '..';
import { useBaseControlProps } from '../hooks';
import type { BaseControlProps } from '../types';

const MyBaseControl = ( props: Omit< BaseControlProps, 'children' > ) => {
	const { baseControlProps, controlProps } = useBaseControlProps( props );

	return (
		<BaseControl { ...baseControlProps }>
			<textarea { ...controlProps } />
		</BaseControl>
	);
};

describe( 'BaseControl', () => {
	it( 'should render help text as description', () => {
		render( <MyBaseControl label="Text" help="My help text" /> );

		expect(
			screen.getByRole( 'textbox', {
				description: 'My help text',
			} )
		).toBeInTheDocument();
	} );

	it( 'should still render help as aria-describedby when not plain text', () => {
		render(
			<MyBaseControl
				label="Text"
				help={ <a href="/foo">My help text</a> }
			/>
		);

		const textarea = screen.getByRole( 'textbox' );
		const help = screen.getByRole( 'link', {
			name: 'My help text',
		} );

		expect( textarea ).toHaveAttribute( 'aria-describedby' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			help.closest( `#${ textarea.getAttribute( 'aria-describedby' ) }` )
		).toBeVisible();
	} );

	describe( 'labelTooltip', () => {
		it( 'should wrap the label text in a tooltip and reveal it on hover', async () => {
			const user = userEvent.setup();
			render(
				<MyBaseControl
					label="Text"
					labelTooltip="Inherited from Styles"
				/>
			);

			// No tooltip until the label is hovered.
			expect(
				screen.queryByText( 'Inherited from Styles' )
			).not.toBeInTheDocument();

			await user.hover( screen.getByText( 'Text' ) );

			expect(
				await screen.findByText( 'Inherited from Styles' )
			).toBeVisible();
		} );

		it( 'should wrap a VisualLabel in a tooltip and reveal it on hover', async () => {
			const user = userEvent.setup();
			render(
				<BaseControl>
					<BaseControl.VisualLabel labelTooltip="Inherited from Styles">
						Text
					</BaseControl.VisualLabel>
				</BaseControl>
			);

			await user.hover( screen.getByText( 'Text' ) );

			expect(
				await screen.findByText( 'Inherited from Styles' )
			).toBeVisible();
		} );
	} );
} );
