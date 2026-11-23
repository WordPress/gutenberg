import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import {
	setBackgroundStyleDefaults,
	backgroundResetAllFilter,
	getBackgroundImageClasses,
	BackgroundImagePanel,
	BACKGROUND_BLOCK_DEFAULT_VALUES,
} from '../background';
import { BackgroundToolsPanel } from '../../components/global-styles/background-panel';
import { store as blockEditorStore } from '../../store';

globalThis.wpVitest.mockMatchMedia();

describe( 'background', () => {
	describe( 'backgroundResetAllFilter', () => {
		it( 'clears every background-owned value, including a custom legacy color.gradient', () => {
			const result = backgroundResetAllFilter( {
				backgroundColor: 'primary',
				gradient: 'vivid-cyan-blue',
				className: 'is-style-fancy has-background',
				style: {
					color: {
						text: 'var:preset|color|contrast',
						background: 'var:preset|color|base',
						gradient:
							'linear-gradient(135deg,rgb(100,100,200) 0%,rgb(200,100,100) 100%)',
					},
					spacing: { padding: '10px' },
					background: { backgroundImage: { url: 'image.png' } },
				},
			} );

			// Background color and gradient attributes are cleared.
			expect( result.backgroundColor ).toBeUndefined();
			expect( result.gradient ).toBeUndefined();

			// The legacy `color.gradient` (a raw/custom value) is cleared. This
			// is the regression guard: it was previously kept for blocks
			// without `background.gradient` support.
			expect( result.style?.color?.gradient ).toBeUndefined();
			expect( result.style?.color?.background ).toBeUndefined();
			expect( result.style?.background ).toBeUndefined();

			// Unrelated styles are preserved.
			expect( result.style?.color?.text ).toBe(
				'var:preset|color|contrast'
			);
			expect( result.style?.spacing ).toEqual( { padding: '10px' } );

			// The `has-background` class is removed, other classes remain.
			expect( result.className ).toBe( 'is-style-fancy' );
		} );

		it( 'drops className entirely when has-background was its only value', () => {
			const result = backgroundResetAllFilter( {
				className: 'has-background',
				style: {
					color: { gradient: 'linear-gradient(0deg,#000,#fff)' },
				},
			} );
			expect( result.className ).toBeUndefined();
		} );

		it( 'leaves className untouched when has-background is not present', () => {
			const result = backgroundResetAllFilter( {
				className: 'is-style-fancy',
				style: {},
			} );
			expect( result.className ).toBe( 'is-style-fancy' );
		} );

		it( 'keeps the background values the panel filter keeps, such as a text gradient', () => {
			const textGradient = {
				gradient: 'var:preset|gradient|vivid',
				backgroundClip: 'text',
			};
			const panelResetAllFilter = vi.fn( () => ( {
				background: textGradient,
			} ) );
			const style = {
				background: {
					...textGradient,
					backgroundImage: { url: 'image.png' },
				},
			};

			const result = backgroundResetAllFilter(
				{ backgroundColor: 'primary', style },
				panelResetAllFilter
			);

			expect( panelResetAllFilter ).toHaveBeenCalledWith( style );
			expect( result.backgroundColor ).toBeUndefined();
			expect( result.style ).toEqual( { background: textGradient } );
		} );
	} );

	describe( 'getBackgroundImageClasses', () => {
		const gradient = 'linear-gradient(0deg,#000,#fff)';
		const backgroundImage = { url: 'image.png' };

		it.each( [
			[ 'a gradient', { background: { gradient } } ],
			[ 'a background image', { background: { backgroundImage } } ],
			[
				'a gradient clipped to a box',
				{ background: { gradient, backgroundClip: 'padding-box' } },
			],
		] )( 'returns has-background for %s', ( _label, style ) => {
			expect( getBackgroundImageClasses( style ) ).toBe(
				'has-background'
			);
		} );

		it.each( [
			[ 'there is no background', {} ],
			[
				'only a clip is set',
				{ background: { backgroundClip: 'border-box' } },
			],
			[
				'a gradient is clipped to the text',
				{ background: { gradient, backgroundClip: 'text' } },
			],
			[
				'a background image is clipped to the text',
				{ background: { backgroundImage, backgroundClip: 'text' } },
			],
		] )( 'returns no class when %s', ( _label, style ) => {
			expect( getBackgroundImageClasses( style ) ).toBe( '' );
		} );
	} );

	describe( 'setBackgroundStyleDefaults', () => {
		const backgroundStyles = {
			backgroundImage: { id: 123, url: 'image.png' },
		};
		const backgroundStylesContain = {
			backgroundImage: { id: 123, url: 'image.png' },
			backgroundSize: 'contain',
		};
		const backgroundStylesNoURL = { backgroundImage: { id: 123 } };
		it.each( [
			[
				'return background size default',
				backgroundStyles,
				{
					backgroundSize:
						BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundSize,
				},
			],
			[ 'return early if no styles are passed', undefined, undefined ],
			[
				'return early if images has no id',
				backgroundStylesNoURL,
				undefined,
			],
			[
				'return early if images has no URL',
				backgroundStylesNoURL,
				undefined,
			],
			[
				'return background position default',
				backgroundStylesContain,
				{
					backgroundPosition:
						BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundPosition,
				},
			],
			[
				'not apply background position value if one already exists in styles',
				{
					...backgroundStylesContain,
					backgroundPosition: 'center',
				},
				undefined,
			],
		] )( 'should %s', ( message, styles, expected ) => {
			const result = setBackgroundStyleDefaults( styles );
			expect( result ).toEqual( expected );
		} );
	} );

	describe( 'BackgroundImagePanel gradient routing', () => {
		const BLOCK_NAME = 'core/test-background-gradient';
		const baseSettings = {
			color: {
				background: true,
				gradients: {
					theme: [
						{
							name: 'Vivid',
							slug: 'vivid',
							gradient:
								'linear-gradient(135deg, rgb(6, 147, 227) 0%, rgb(155, 81, 224) 100%)',
						},
					],
				},
			},
		};

		beforeAll( () => {
			// A variable, since the supports type lacks the default controls.
			const supports = {
				background: {
					gradient: true,
					__experimentalDefaultControls: { gradient: true },
				},
				color: {
					gradients: true,
					__experimentalDefaultControls: { background: true },
				},
			};
			registerBlockType( BLOCK_NAME, {
				apiVersion: 3,
				title: 'Test background gradient',
				category: 'text',
				attributes: {},
				supports,
			} );
		} );

		afterAll( () => {
			unregisterBlockType( BLOCK_NAME );
		} );

		it( 'stores the gradient in the background style when the setting is enabled', async () => {
			const settings = {
				...baseSettings,
				background: { gradient: true },
			};
			const user = userEvent.setup();
			const setAttributes = vi.fn();

			render(
				<BackgroundImagePanel
					clientId="block-1"
					name={ BLOCK_NAME }
					setAttributes={ setAttributes }
					settings={ settings }
					asWrapper={ BackgroundToolsPanel }
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: /Gradient/ } )
			);
			await user.click( await screen.findByRole( 'option' ) );

			// The gradient is kept whole in the style, not extracted to the
			// legacy attribute.
			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					style: {
						background: {
							gradient: 'var:preset|gradient|vivid',
						},
					},
					gradient: undefined,
				} )
			);
		} );

		it( 'stores the gradient in the legacy attribute when the setting is disabled', async () => {
			const settings = {
				...baseSettings,
				background: { gradient: false },
			};
			const user = userEvent.setup();
			const setAttributes = vi.fn();

			render(
				<BackgroundImagePanel
					clientId="block-1"
					name={ BLOCK_NAME }
					setAttributes={ setAttributes }
					settings={ settings }
					asWrapper={ BackgroundToolsPanel }
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: /Gradient/ } )
			);
			await user.click( await screen.findByRole( 'option' ) );

			// The panel writes to the legacy `color.gradient` when the theme
			// opts out, and the slug leaves nothing inline in the style.
			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					style: undefined,
					gradient: 'vivid',
				} )
			);
		} );
	} );

	describe( 'BackgroundImagePanel has-background migration', () => {
		const settings = {
			color: {
				background: true,
				gradients: {
					theme: [
						{
							name: 'Vivid',
							slug: 'vivid',
							gradient:
								'linear-gradient(135deg, rgb(6, 147, 227) 0%, rgb(155, 81, 224) 100%)',
						},
					],
				},
			},
			background: { gradient: true },
		};
		const legacyStyle = {
			color: { gradient: 'linear-gradient(0deg,#000,#fff)' },
		};
		const blocks = {
			'core/test-bg-serialize': true,
			'core/test-bg-skip': { __experimentalSkipSerialization: true },
			'core/test-bg-skip-gradient': {
				__experimentalSkipSerialization: [ 'gradient' ],
			},
		};

		beforeAll( () => {
			Object.entries( blocks ).forEach( ( [ blockName, extra ] ) => {
				const supports = {
					background: {
						gradient: true,
						__experimentalDefaultControls: { gradient: true },
						...( extra === true ? {} : extra ),
					},
					color: { gradients: true },
				};
				registerBlockType( blockName, {
					apiVersion: 3,
					title: blockName,
					category: 'text',
					attributes: {},
					supports,
				} );
			} );
		} );

		afterAll( () => {
			Object.keys( blocks ).forEach( unregisterBlockType );
		} );

		function setUpPanel(
			blockName: string,
			attributes: Record< string, unknown >
		) {
			const setAttributes = vi.fn();
			dispatch( blockEditorStore ).resetBlocks( [
				{
					clientId: 'block-1',
					name: blockName,
					isValid: true,
					attributes,
					innerBlocks: [],
				},
			] );
			render(
				<BackgroundImagePanel
					clientId="block-1"
					name={ blockName }
					setAttributes={ setAttributes }
					settings={ settings }
					asWrapper={ BackgroundToolsPanel }
				/>
			);
			return setAttributes;
		}

		async function pickGradient( blockName: string ) {
			const user = userEvent.setup();
			const setAttributes = setUpPanel( blockName, {
				className: 'is-style-fancy',
				style: legacyStyle,
			} );
			await user.click(
				screen.getByRole( 'button', { name: /Gradient/ } )
			);
			await user.click( await screen.findByRole( 'option' ) );
			return setAttributes.mock.lastCall?.[ 0 ];
		}

		it( 'adds has-background when the gradient serializes onto the wrapper', async () => {
			const attributes = await pickGradient( 'core/test-bg-serialize' );
			expect( attributes.className ).toBe(
				'is-style-fancy has-background'
			);
		} );

		it.each( [ 'core/test-bg-skip', 'core/test-bg-skip-gradient' ] )(
			'does not add has-background when %s skips serialization',
			async ( blockName ) => {
				const attributes = await pickGradient( blockName );
				expect( attributes.className ).toBeUndefined();
				expect( attributes.style ).toEqual( {
					background: { gradient: 'var:preset|gradient|vivid' },
				} );
			}
		);

		it( 'removes a has-background added earlier when the gradient is cleared', async () => {
			const user = userEvent.setup();
			const setAttributes = setUpPanel( 'core/test-bg-skip', {
				className: 'is-style-fancy has-background',
				style: {
					background: { gradient: 'var:preset|gradient|vivid' },
				},
			} );
			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );
			expect( setAttributes.mock.lastCall?.[ 0 ].className ).toBe(
				'is-style-fancy'
			);
		} );
	} );
} );
