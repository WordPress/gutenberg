/**
 * External dependencies
 */
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { initializeEditor } from '../../../../../test/integration/helpers/integration-test-editor';

async function setup( testBlock ) {
	return initializeEditor( { testBlock } );
}

async function selectCoverBlock() {
	await userEvent.click(
		screen.getByRole( 'button', {
			name: 'Color: Black',
		} )
	);
	await userEvent.click(
		screen.getByRole( 'button', {
			name: 'Select Cover',
		} )
	);
}
describe( 'Cover block', () => {
	describe( 'Editor canvas', () => {
		test( 'shows placeholder if background image and color not set', async () => {
			await setup( { name: 'core/cover' } );

			expect(
				screen.getByRole( 'group', {
					name: 'To edit this block, you need permission to upload media.',
				} )
			).toBeInTheDocument();
		} );

		test( 'can set overlay color using color picker on block placeholder', async () => {
			const { container } = await setup( { name: 'core/cover' } );
			const colorPicker = screen.getByRole( 'button', {
				name: 'Color: Black',
			} );
			await userEvent.click( colorPicker );
			const color = colorPicker.style.backgroundColor;
			expect(
				screen.queryByRole( 'group', {
					name: 'To edit this block, you need permission to upload media.',
				} )
			).not.toBeInTheDocument();

			// eslint-disable-next-line testing-library/no-node-access
			const overlay = container.getElementsByClassName(
				'wp-block-cover__background'
			);
			expect( overlay[ 0 ] ).toHaveStyle(
				`background-color: ${ color }`
			);
		} );

		test( 'can have the title edited', async () => {
			await setup( { name: 'core/cover' } );

			await userEvent.click(
				screen.getByRole( 'button', {
					name: 'Color: Black',
				} )
			);

			const title = screen.getByLabelText( 'Empty block;', {
				exact: false,
			} );
			await userEvent.click( title );
			await userEvent.keyboard( 'abc' );
			expect( title ).toHaveTextContent( 'abc' );
		} );
	} );
	describe( 'Block toolbar', () => {
		test( 'shows block toolbar if selected block', async () => {
			await setup( { name: 'core/cover' } );

			await selectCoverBlock();

			expect(
				screen.getByRole( 'button', {
					name: 'Change content position',
				} )
			).toBeInTheDocument();
		} );
	} );
	describe( 'Inspector controls', () => {
		describe( 'Media settings', () => {
			test( 'does not display media settings panel if url is not set', async () => {
				await setup( { name: 'core/cover' } );
				expect(
					screen.queryByRole( 'button', {
						name: 'Media settings',
					} )
				).not.toBeInTheDocument();
			} );
			test( 'displays media settings panel if url is set', async () => {
				await setup( {
					name: 'core/cover',
					attributes: {
						url: 'http://localhost/my-image.jpg',
					},
				} );

				await userEvent.click(
					screen.getByLabelText( 'Block: Cover' )
				);
				expect(
					screen.getByRole( 'button', {
						name: 'Media settings',
					} )
				).toBeInTheDocument();
			} );
		} );

		test( 'applies selected opacity to block', async () => {
			const { container } = await setup( { name: 'core/cover' } );

			await selectCoverBlock();

			// eslint-disable-next-line testing-library/no-node-access
			const overlay = container.getElementsByClassName(
				'wp-block-cover__background'
			);

			expect( overlay[ 0 ] ).toHaveClass( 'has-background-dim-100' );

			await userEvent.click(
				screen.getByRole( 'tab', {
					name: 'Styles',
				} )
			);

			fireEvent.change(
				screen.getByRole( 'spinbutton', {
					name: 'Overlay opacity',
				} ),
				{
					target: { value: '40' },
				}
			);

			expect( overlay[ 0 ] ).toHaveClass( 'has-background-dim-40' );
		} );
	} );
} );
