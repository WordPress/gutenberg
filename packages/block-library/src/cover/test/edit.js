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
	selectBlock,
} from 'test/integration/helpers/integration-test-editor';

const defaultSettings = {
	__experimentalFeatures: {
		color: {
			defaultPalette: true,
			defaultGradients: true,
			palette: {
				default: [
					{ name: 'Black', slug: 'black', color: '#000000' },
					{ name: 'White', slug: 'white', color: '#ffffff' },
				],
			},
		},
	},
	colors: [ { name: 'Black', slug: 'black', color: '#000000' } ],
	disableCustomColors: false,
	disableCustomGradients: false,
};

const disabledColorSettings = {
	color: {
		defaultPalette: false,
		defaultGradients: false,
	},
	disableCustomColors: true,
	disableCustomGradients: true,
};

/**
 * Runs `callback` with `requestAnimationFrame` callbacks flushed on a microtask
 * ahead of any pending `setTimeout( 0 )` timers, then restores the original.
 *
 * In a browser, Ariakit normalizes the matrix's roving tabindex in a
 * `requestAnimationFrame` before `useFocusOnMount`'s `setTimeout( 0 )` focuses
 * the active (center) cell, so opening the dropdown leaves the content position
 * untouched. JSDOM implements `requestAnimationFrame` as a ~16ms timer, which
 * inverts the ordering and would otherwise focus and select the first DOM cell.
 *
 * @param {() => ( Promise< unknown > | unknown )} callback
 * @return {Promise< unknown >} Resolves with the callback's return value.
 */
async function withAnimationFramesBeforeTimers( callback ) {
	const originalRequestAnimationFrame = global.requestAnimationFrame;

	let flushing = false;
	global.requestAnimationFrame = ( frameCallback ) => {
		// Frames scheduled while flushing fall back to the real implementation
		// so self-rescheduling loops (e.g. Popover's Floating UI `autoUpdate`)
		// don't spin forever on the microtask queue.
		if ( flushing ) {
			return originalRequestAnimationFrame( frameCallback );
		}

		queueMicrotask( () => {
			flushing = true;
			try {
				frameCallback( performance.now() );
			} finally {
				flushing = false;
			}
		} );

		return 0;
	};

	try {
		return await callback();
	} finally {
		global.requestAnimationFrame = originalRequestAnimationFrame;
	}
}

async function setup( attributes, useCoreBlocks, customSettings ) {
	const testBlock = { name: 'core/cover', attributes };
	const settings = customSettings || defaultSettings;
	return initializeEditor( testBlock, useCoreBlocks, settings );
}

async function createAndSelectBlock() {
	await userEvent.click(
		screen.getByRole( 'button', {
			name: 'Black',
		} )
	);
	await selectBlock( 'Block: Cover' );
}

async function openStylesTabIfAvailable() {
	const stylesTab = screen.queryByRole( 'tab', {
		name: 'Styles',
	} );

	if ( stylesTab ) {
		await userEvent.click( stylesTab );
	}
}

describe( 'Cover block', () => {
	describe( 'Editor canvas', () => {
		test( 'shows placeholder if background image and color not set', async () => {
			await setup();

			expect(
				within( screen.getByLabelText( 'Block: Cover' ) ).getByText(
					'To edit this block, you need permission to upload media.'
				)
			).toBeInTheDocument();
		} );

		test( 'can set overlay color using color picker on block placeholder', async () => {
			const { container } = await setup();
			const colorPicker = screen.getByRole( 'button', {
				name: 'Black',
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
			await setup();

			await userEvent.click(
				screen.getByRole( 'button', {
					name: 'Black',
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
		test( 'full height toggle sets minHeight style attribute to 100vh when clicked', async () => {
			await setup();
			await createAndSelectBlock();

			expect( screen.getByLabelText( 'Block: Cover' ) ).not.toHaveStyle(
				'min-height: 100vh;'
			);

			await userEvent.click( screen.getByLabelText( 'Full height' ) );

			expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveStyle(
				'min-height: 100vh;'
			);
		} );

		test( 'content position button sets content position', async () => {
			await setup();
			await createAndSelectBlock();

			// Open the matrix dropdown with browser-like frame ordering so
			// focus-on-mount lands on the active cell instead of dirtying the
			// content position.
			await withAnimationFramesBeforeTimers( () =>
				userEvent.click(
					screen.getByLabelText( 'Change content position' )
				)
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

		test( 'clears media when clear media button clicked', async () => {
			await setup( {
				url: 'http://localhost/my-image.jpg',
			} );

			await selectBlock( 'Block: Cover' );
			expect(
				within( screen.getByLabelText( 'Block: Cover' ) ).getByRole(
					'img'
				)
			).toBeInTheDocument();

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Replace' } )
			);
			await userEvent.click(
				screen.getByRole( 'menuitem', {
					name: 'Reset',
				} )
			);

			expect(
				within( screen.getByLabelText( 'Block: Cover' ) ).queryByRole(
					'img'
				)
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'Inspector controls', () => {
		describe( 'Media settings', () => {
			test( 'does not display media settings panel if url is not set', async () => {
				await setup();
				expect(
					screen.queryByRole( 'heading', {
						name: 'Settings',
					} )
				).not.toBeInTheDocument();
			} );
			test( 'does not display settings tab when media settings are empty', async () => {
				await setup();
				await createAndSelectBlock();

				expect(
					screen.queryByRole( 'tab', {
						name: 'Settings',
					} )
				).not.toBeInTheDocument();
				expect(
					screen.getByRole( 'button', {
						name: 'Advanced',
					} )
				).toBeInTheDocument();
			} );
			test( 'displays media settings panel if url is set', async () => {
				await setup( {
					url: 'http://localhost/my-image.jpg',
				} );

				await selectBlock( 'Block: Cover' );
				expect(
					await screen.findByRole( 'heading', { name: 'Settings' } )
				).toBeInTheDocument();
			} );
		} );

		test( 'sets hasParallax attribute to true if fixed background toggled', async () => {
			await setup( {
				url: 'http://localhost/my-image.jpg',
			} );
			expect( screen.getByLabelText( 'Block: Cover' ) ).not.toHaveClass(
				'has-parallax'
			);
			await selectBlock( 'Block: Cover' );
			await userEvent.click(
				await screen.findByLabelText( 'Fixed background' )
			);
			expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveClass(
				'has-parallax'
			);
		} );

		test( 'sets isRepeated attribute to true if repeated background toggled', async () => {
			await setup( {
				url: 'http://localhost/my-image.jpg',
			} );
			expect( screen.getByLabelText( 'Block: Cover' ) ).not.toHaveClass(
				'is-repeated'
			);
			await selectBlock( 'Block: Cover' );
			await userEvent.click(
				await screen.findByLabelText( 'Repeated background' )
			);
			expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveClass(
				'is-repeated'
			);
		} );

		test( 'sets left focalPoint attribute when focal point values changed', async () => {
			await setup( {
				url: 'http://localhost/my-image.jpg',
			} );

			await selectBlock( 'Block: Cover' );
			await userEvent.clear( await screen.findByLabelText( 'Left' ) );
			await userEvent.type( screen.getByLabelText( 'Left' ), '100' );

			expect(
				within( screen.getByLabelText( 'Block: Cover' ) ).getByRole(
					'img'
				)
			).toHaveStyle( 'object-position: 100% 50%;' );
		} );

		test( 'sets alt attribute if text entered in alt text box', async () => {
			await setup( {
				url: 'http://localhost/my-image.jpg',
			} );

			await selectBlock( 'Block: Cover' );
			await userEvent.type(
				await screen.findByLabelText( 'Alternative text' ),
				'Me'
			);
			expect( screen.getByAltText( 'Me' ) ).toBeInTheDocument();
		} );

		describe( 'Color panel', () => {
			test( 'applies selected opacity to block when number control value changed', async () => {
				const { container } = await setup();

				await createAndSelectBlock();

				// eslint-disable-next-line testing-library/no-node-access
				const overlay = container.getElementsByClassName(
					'wp-block-cover__background'
				);

				expect( overlay[ 0 ] ).toHaveClass( 'has-background-dim-100' );

				await openStylesTabIfAvailable();
				// Need act here as the isDark method is async.
				// eslint-disable-next-line testing-library/no-unnecessary-act
				await act( async () => {
					fireEvent.change(
						screen.getByRole( 'spinbutton', {
							name: 'Overlay opacity',
						} ),
						{
							target: { value: '40' },
						}
					);
				} );

				expect( overlay[ 0 ] ).toHaveClass( 'has-background-dim-40' );
			} );

			test( 'applies selected opacity to block when slider moved', async () => {
				const { container } = await setup();

				await createAndSelectBlock();

				// eslint-disable-next-line testing-library/no-node-access
				const overlay = container.getElementsByClassName(
					'wp-block-cover__background'
				);

				expect( overlay[ 0 ] ).toHaveClass( 'has-background-dim-100' );

				await openStylesTabIfAvailable();

				// Need act here as the isDark method is async.
				// eslint-disable-next-line testing-library/no-unnecessary-act
				await act( async () => {
					fireEvent.change(
						screen.getByRole( 'slider', {
							name: 'Overlay opacity',
						} ),
						{ target: { value: 30 } }
					);
				} );

				expect( overlay[ 0 ] ).toHaveClass( 'has-background-dim-30' );
			} );

			describe( 'when colors are disabled', () => {
				test( 'does not render overlay control', async () => {
					await setup( undefined, true, disabledColorSettings );
					await selectBlock( 'Block: Cover' );
					await openStylesTabIfAvailable();

					const overlayControl = screen.queryByRole( 'button', {
						name: 'Overlay',
					} );

					expect( overlayControl ).not.toBeInTheDocument();
				} );
				test( 'does not render opacity control', async () => {
					await setup( undefined, true, disabledColorSettings );
					await selectBlock( 'Block: Cover' );
					await openStylesTabIfAvailable();

					const opacityControl = screen.queryByRole( 'slider', {
						name: 'Overlay opacity',
					} );

					expect( opacityControl ).not.toBeInTheDocument();
				} );
			} );
		} );

		describe( 'Dimensions panel', () => {
			test( 'sets minHeight attribute when number control value changed', async () => {
				await setup();
				await createAndSelectBlock();
				await openStylesTabIfAvailable();
				await userEvent.clear(
					screen.getByLabelText( 'Minimum height' )
				);
				await userEvent.type(
					screen.getByLabelText( 'Minimum height' ),
					'300'
				);

				expect( screen.getByLabelText( 'Block: Cover' ) ).toHaveStyle(
					'min-height: 300px;'
				);
			} );
		} );
	} );

	describe( 'isDark settings', () => {
		test( 'should toggle is-light class if background changed from light to dark', async () => {
			await setup();
			const colorPicker = screen.getByRole( 'button', {
				name: 'White',
			} );
			await userEvent.click( colorPicker );

			const coverBlock = screen.getByLabelText( 'Block: Cover' );

			expect( coverBlock ).toHaveClass( 'is-light' );

			await selectBlock( 'Block: Cover' );
			await openStylesTabIfAvailable();
			await userEvent.click( screen.getByText( 'Overlay' ) );
			const popupColorPicker = screen.getByRole( 'option', {
				name: 'Black',
			} );
			await userEvent.click( popupColorPicker );
			expect( coverBlock ).not.toHaveClass( 'is-light' );
		} );
		test( 'should remove is-light class if overlay color is removed', async () => {
			await setup();
			const colorPicker = screen.getByRole( 'button', {
				name: 'White',
			} );
			await userEvent.click( colorPicker );
			const coverBlock = screen.getByLabelText( 'Block: Cover' );
			expect( coverBlock ).toHaveClass( 'is-light' );
			await selectBlock( 'Block: Cover' );
			await openStylesTabIfAvailable();
			await userEvent.click( screen.getByText( 'Overlay' ) );
			// The default color is black, so clicking the black color button will remove the background color,
			// which should remove the isDark setting and assign the is-light class.
			const popupColorPicker = screen.getByRole( 'option', {
				name: 'White',
			} );
			await userEvent.click( popupColorPicker );
			expect( coverBlock ).not.toHaveClass( 'is-light' );
		} );
	} );
} );
