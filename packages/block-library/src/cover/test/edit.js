/**
 * External dependencies
 */
import { screen, fireEvent, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import {
	registerBlockBindingsSource,
	unregisterBlockBindingsSource,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	initializeEditor,
	selectBlock,
} from 'test/integration/helpers/integration-test-editor';
import { getMediaColor } from '../edit/color-utils';

// Wrap `getMediaColor` so individual tests can intercept its calls / control
// the timing of its async resolution. The default `mockImplementation`
// delegates to the real implementation (preserving behaviour for every other
// test in this file).
jest.mock( '../edit/color-utils', () => {
	const actual = jest.requireActual( '../edit/color-utils' );
	return {
		__esModule: true,
		...actual,
		getMediaColor: jest.fn( actual.getMediaColor ),
	};
} );

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

async function selectViewportState( name ) {
	await userEvent.click(
		screen.getByRole( 'button', {
			name: 'State: Default',
		} )
	);
	await userEvent.click(
		screen.getByRole( 'menuitem', {
			name,
		} )
	);
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

			test( 'does not render overlay controls when a viewport state is selected', async () => {
				await setup();
				await createAndSelectBlock();
				await openStylesTabIfAvailable();

				expect(
					screen.getByRole( 'button', {
						name: 'Overlay',
					} )
				).toBeInTheDocument();

				await selectViewportState( 'Tablet' );

				expect(
					screen.queryByRole( 'button', {
						name: 'Overlay',
					} )
				).not.toBeInTheDocument();
				expect(
					screen.queryByRole( 'slider', {
						name: 'Overlay opacity',
					} )
				).not.toBeInTheDocument();
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

	// Shared binding-source harness for the four binding describes below.
	// Each describe gets a unique source name (so registrations cannot leak)
	// and a `sourceState` bag tests can mutate before `setup()` to dial the
	// resolved `id` / `url` returned by `getValues`.
	function useBindingSource( name, defaultUrl, defaultId ) {
		const sourceState = { url: defaultUrl, id: defaultId };
		beforeEach( () => {
			sourceState.url = defaultUrl;
			sourceState.id = defaultId;
			registerBlockBindingsSource( {
				name,
				label: name,
				getValues: () => ( {
					id: sourceState.id,
					url: sourceState.url,
				} ),
				canUserEditValue: () => false,
			} );
		} );
		afterEach( () => unregisterBlockBindingsSource( name ) );
		return {
			sourceState,
			bindings: { id: { source: name }, url: { source: name } },
		};
	}

	describe( 'Bindings rendering', () => {
		const TEST_SOURCE = 'test/cover-binding-edit';
		const TEST_RESOLVED_URL = 'http://localhost/bound-image.jpg';
		const { bindings: boundBindings } = useBindingSource(
			TEST_SOURCE,
			TEST_RESOLVED_URL,
			4242
		);

		test( 'force-renders an <img> for an active binding with a resolved URL, ignoring hasParallax / isRepeated', async () => {
			// Framework resolves attributes.url before passing to Edit. Mimic
			// here by setting attributes.url directly to the bound value.
			await setup( {
				url: TEST_RESOLVED_URL,
				backgroundType: 'image',
				hasParallax: true,
				isRepeated: true,
				metadata: { bindings: boundBindings },
			} );

			const boundImg = await screen.findByRole( 'img' );
			expect( boundImg ).toHaveClass(
				'wp-block-cover__image-background'
			);
			expect( boundImg ).toHaveAttribute( 'src', TEST_RESOLVED_URL );
			// Force-img branch precludes the parallax/repeat <div> form.
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				document.querySelector( 'div.wp-block-cover__image-background' )
			).not.toBeInTheDocument();
		} );

		test( 'leaves the embed-video render path engaged on a cover with bindings (binding is inert)', async () => {
			await setup( {
				url: 'https://example.com/video',
				backgroundType: 'embed-video',
				metadata: { bindings: boundBindings },
			} );

			const coverBlock = screen.getByLabelText( 'Block: Cover' );
			// bindingActive forced false for embed-video → force-img skipped.
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				coverBlock.querySelector(
					'img.wp-block-cover__image-background'
				)
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'CoverEdit single observer', () => {
		const TEST_SOURCE = 'test/cover-binding-observer';
		const TEST_RESOLVED_URL = 'http://localhost/observer-image.jpg';
		useBindingSource( TEST_SOURCE, TEST_RESOLVED_URL, 7777 );

		beforeEach( () => {
			// Default `getMediaColor` to the real implementation; individual
			// tests can override via `mockImplementation`.
			getMediaColor.mockReset();
			getMediaColor.mockImplementation(
				jest.requireActual( '../edit/color-utils' ).getMediaColor
			);
		} );

		test( 'does not write any DC-2-prohibited attribute back to the block when a binding becomes active', async () => {
			// Saved state: dimRatio=100, hasParallax=true, isRepeated=true,
			// plus an active binding. Observer must NOT flip any of these.
			// attributes.url is what the framework resolves to before reaching
			// Edit; the test passes it directly.
			await setup( {
				url: TEST_RESOLVED_URL,
				id: 1234,
				backgroundType: 'image',
				dimRatio: 100,
				hasParallax: true,
				isRepeated: true,
				metadata: {
					bindings: {
						id: { source: TEST_SOURCE },
						url: { source: TEST_SOURCE },
					},
				},
			} );

			await screen.findByRole( 'img' );
			// Flush URL-resolved observer + any subsequent re-renders.
			await act( async () => Promise.resolve() );
			await act( async () => Promise.resolve() );

			const coverBlock = screen.getByLabelText( 'Block: Cover' );
			expect( coverBlock ).toHaveAttribute(
				'data-url',
				TEST_RESOLVED_URL
			);
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				coverBlock.querySelector(
					'img.wp-block-cover__image-background'
				)
			).toHaveAttribute( 'src', TEST_RESOLVED_URL );
			expect( coverBlock ).toHaveClass( 'has-parallax' );
			expect( coverBlock ).toHaveClass( 'is-repeated' );

			// effectiveDimRatio=50 → dimRatioToClass(50) is null; assert the
			// absence of -100 that the raw stored dimRatio would have caused.
			// eslint-disable-next-line testing-library/no-node-access
			const overlay = coverBlock.querySelector(
				'.wp-block-cover__background'
			);
			expect( overlay ).toHaveClass( 'has-background-dim' );
			expect( overlay ).not.toHaveClass( 'has-background-dim-100' );
		} );

		test( 'observer fires `getMediaColor` exactly once per dynamic media URL on mount', async () => {
			// DC-1 precondition: a single mount fires the observer once for
			// the resolved dynamic URL. Pending promise avoids "update not
			// wrapped in act" warnings from the post-await flush.
			const URL_A = TEST_RESOLVED_URL;
			const pending = new Promise( () => {} );
			getMediaColor.mockImplementation( ( url ) =>
				url === URL_A ? pending : Promise.resolve( '#888888' )
			);

			await setup( {
				url: URL_A,
				backgroundType: 'image',
				dimRatio: 70,
				metadata: {
					bindings: {
						id: { source: TEST_SOURCE },
						url: { source: TEST_SOURCE },
					},
				},
			} );

			// Filter to URL_A — harness may incidentally call with undefined.
			expect(
				getMediaColor.mock.calls.filter( ( [ u ] ) => u === URL_A )
			).toHaveLength( 1 );
		} );

		test( 'observer ignores static media URLs handled by selection callbacks', async () => {
			const URL_A = 'http://localhost/static-image.jpg';
			getMediaColor.mockResolvedValue( '#888888' );

			await setup( {
				url: URL_A,
				backgroundType: 'image',
				dimRatio: 70,
			} );

			expect(
				getMediaColor.mock.calls.filter( ( [ u ] ) => u === URL_A )
			).toHaveLength( 0 );
		} );
	} );
} );
