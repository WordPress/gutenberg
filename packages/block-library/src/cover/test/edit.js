/**
 * External dependencies
 */
import { screen, fireEvent, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import {
	initializeEditor,
	registerAllCoreBlocks,
	unRegisterAllBlocks,
	createTestBlock,
} from 'test/integration/helpers/integration-test-editor';

async function setup( testBlock ) {
	const testBlocks = [
		createTestBlock( testBlock.name, testBlock.attributes ),
	];
	return initializeEditor( { testBlocks } );
}

async function createAndSelectCoverBlock() {
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

async function selectCoverBlock() {
	await userEvent.click( screen.getByLabelText( 'Block: Cover' ) );
}

describe( 'Cover block', () => {
	beforeAll( () => {
		registerAllCoreBlocks();
	} );
	afterAll( () => {
		unRegisterAllBlocks();
	} );

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
		test( 'full height toggle sets minHeight attributes to 100vh when clicked', async () => {
			await setup( { name: 'core/cover' } );
			await createAndSelectCoverBlock();

			expect( screen.getByLabelText( 'Block: Cover' ) ).not.toHaveStyle(
				' min-height: 100vh;'
			);

			await userEvent.click(
				screen.getByLabelText( 'Toggle full height' )
			);

			expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveStyle(
				' min-height: 100vh;'
			);
		} );

		test( 'content position button sets content position', async () => {
			await setup( { name: 'core/cover' } );
			await createAndSelectCoverBlock();

			await userEvent.click(
				screen.getByLabelText( 'Change content position' )
			);

			expect( screen.getByLabelText( 'Block: Cover' ) ).not.toHaveClass(
				'has-custom-content-position'
			);

			await act( async () =>
				within( screen.getByRole( 'grid' ) )
					.getByRole( 'gridcell', {
						name: 'top left',
					} )
					.focus()
			);

			expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveClass(
				'has-custom-content-position'
			);
			expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveClass(
				'is-position-top-left'
			);
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

				await selectCoverBlock();
				expect(
					screen.getByRole( 'button', {
						name: 'Media settings',
					} )
				).toBeInTheDocument();
			} );
		} );

		test( 'sets hasParallax attribute to true if fixed background toggled', async () => {
			await setup( {
				name: 'core/cover',
				attributes: {
					url: 'http://localhost/my-image.jpg',
				},
			} );
			expect( screen.getByLabelText( 'Block: Cover' ) ).not.toHaveClass(
				'has-parallax'
			);
			await selectCoverBlock();
			await userEvent.click(
				screen.getByLabelText( 'Fixed background' )
			);
			expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveClass(
				'has-parallax'
			);
		} );

		test( 'sets isRepeated attribute to true if repeated background toggled', async () => {
			await setup( {
				name: 'core/cover',
				attributes: {
					url: 'http://localhost/my-image.jpg',
				},
			} );
			expect( screen.getByLabelText( 'Block: Cover' ) ).not.toHaveClass(
				'is-repeated'
			);
			await selectCoverBlock();
			await userEvent.click(
				screen.getByLabelText( 'Repeated background' )
			);
			expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveClass(
				'is-repeated'
			);
		} );

		test( 'sets left focalPoint attribute when focal point values changed', async () => {
			const { container } = await setup( {
				name: 'core/cover',
				attributes: {
					url: 'http://localhost/my-image.jpg',
				},
			} );

			await selectCoverBlock();
			await userEvent.clear( screen.getByLabelText( 'Left' ) );
			await userEvent.type( screen.getByLabelText( 'Left' ), '100' );
			// eslint-disable-next-line testing-library/no-node-access
			const image = container.getElementsByClassName(
				'wp-block-cover__image-background'
			);
			expect( image[ 0 ] ).toHaveStyle( 'object-position: 100% 50%;' );
		} );

		test( 'sets alt attribute if text entered in alt text box', async () => {
			await setup( {
				name: 'core/cover',
				attributes: {
					url: 'http://localhost/my-image.jpg',
				},
			} );

			await selectCoverBlock();
			await userEvent.type(
				screen.getByLabelText( 'Alt text (alternative text)' ),
				'Me'
			);
			expect( screen.getByAltText( 'Me' ) ).toBeInTheDocument();
		} );

		test( 'clears media  when clear media button clicked', async () => {
			const { container } = await setup( {
				name: 'core/cover',
				attributes: {
					url: 'http://localhost/my-image.jpg',
				},
			} );

			await selectCoverBlock();
			// eslint-disable-next-line testing-library/no-node-access
			const img = container.getElementsByClassName(
				'wp-block-cover__image-background'
			)[ 0 ];
			expect( img ).toBeInTheDocument();

			await userEvent.click(
				screen.getByRole( 'button', {
					name: 'Clear Media',
				} )
			);

			expect( img ).not.toBeInTheDocument();
		} );

		describe( 'Color panel', () => {
			test( 'applies selected opacity to block when number control value changed', async () => {
				const { container } = await setup( { name: 'core/cover' } );

				await createAndSelectCoverBlock();

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

			test( 'applies selected opacity to block when slider moved', async () => {
				const { container } = await setup( { name: 'core/cover' } );

				await createAndSelectCoverBlock();

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
					screen.getByRole( 'slider', {
						name: 'Overlay opacity',
					} ),
					{ target: { value: 30 } }
				);

				expect( overlay[ 0 ] ).toHaveClass( 'has-background-dim-30' );
			} );
		} );

		describe( 'Dimensions panel', () => {
			test( 'sets minHeight attribute when number control value changed', async () => {
				await setup( { name: 'core/cover' } );
				await createAndSelectCoverBlock();
				await userEvent.click(
					screen.getByRole( 'tab', {
						name: 'Styles',
					} )
				);
				await userEvent.clear(
					screen.getByLabelText( 'Minimum height of cover' )
				);
				await userEvent.type(
					screen.getByLabelText( 'Minimum height of cover' ),
					'300'
				);

				expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveStyle(
					'min-height: 300px;'
				);
			} );
		} );
	} );
} );
