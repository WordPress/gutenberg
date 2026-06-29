/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */

import BackgroundPanel, {
	hasBackgroundImageValue,
	hasBackgroundGradientValue,
	hasBackgroundColorValue,
	hasLegacyColorGradientValue,
	mergeInheritedBackgroundStyle,
} from '../background-panel';

describe( 'hasBackgroundImageValue', () => {
	it( 'should return `true` when id and url exist', () => {
		expect(
			hasBackgroundImageValue( {
				background: { backgroundImage: { id: 1, url: 'url' } },
			} )
		).toBe( true );
	} );

	it( 'should return `true` when only url exists', () => {
		expect(
			hasBackgroundImageValue( {
				background: { backgroundImage: { url: 'url' } },
			} )
		).toBe( true );
	} );

	it( 'should return `true` when only id exists', () => {
		expect(
			hasBackgroundImageValue( {
				background: { backgroundImage: { id: 1 } },
			} )
		).toBe( true );
	} );

	it( 'should return `false` when id and url do not exist', () => {
		expect(
			hasBackgroundImageValue( {
				background: { backgroundImage: {} },
			} )
		).toBe( false );
	} );
} );

describe( 'hasBackgroundGradientValue', () => {
	it( 'should return `true` when a gradient string is set', () => {
		expect(
			hasBackgroundGradientValue( {
				background: {
					gradient: 'linear-gradient(135deg, red 0%, blue 100%)',
				},
			} )
		).toBe( true );
	} );

	it( 'should return `true` for a preset slug reference', () => {
		expect(
			hasBackgroundGradientValue( {
				background: { gradient: 'var:preset|gradient|vivid-cyan-blue' },
			} )
		).toBe( true );
	} );

	it( 'should return `false` when gradient is undefined', () => {
		expect( hasBackgroundGradientValue( { background: {} } ) ).toBe(
			false
		);
	} );

	it( 'should return `false` when gradient is an empty string', () => {
		expect(
			hasBackgroundGradientValue( { background: { gradient: '' } } )
		).toBe( false );
	} );

	it( 'should return `false` when background is undefined', () => {
		expect( hasBackgroundGradientValue( {} ) ).toBe( false );
	} );

	it( 'should return `false` when style is undefined', () => {
		expect( hasBackgroundGradientValue( undefined ) ).toBe( false );
	} );
} );

describe( 'mergeInheritedBackgroundStyle', () => {
	it( 'combines inherited background image fields with a local gradient override', () => {
		expect(
			mergeInheritedBackgroundStyle(
				{
					background: {
						gradient: 'linear-gradient(135deg, red 0%, blue 100%)',
					},
				},
				{
					background: {
						backgroundImage: {
							id: 1,
							url: 'http://example.com/inherited.jpg',
						},
						backgroundSize: 'cover',
						backgroundPosition: '25% 75%',
						backgroundRepeat: 'no-repeat',
					},
				}
			)
		).toEqual( {
			background: {
				backgroundImage: {
					id: 1,
					url: 'http://example.com/inherited.jpg',
				},
				gradient: 'linear-gradient(135deg, red 0%, blue 100%)',
				backgroundSize: 'cover',
				backgroundPosition: '25% 75%',
				backgroundRepeat: 'no-repeat',
			},
		} );
	} );

	it( 'combines inherited gradient with a local background image override', () => {
		expect(
			mergeInheritedBackgroundStyle(
				{
					background: {
						backgroundImage: {
							id: 2,
							url: 'http://example.com/local.jpg',
						},
						backgroundSize: 'contain',
					},
				},
				{
					background: {
						gradient:
							'linear-gradient(135deg, green 0%, yellow 100%)',
						backgroundImage: {
							id: 1,
							url: 'http://example.com/inherited.jpg',
						},
						backgroundSize: 'cover',
						backgroundPosition: '25% 75%',
					},
				}
			)
		).toEqual( {
			background: {
				backgroundImage: {
					id: 2,
					url: 'http://example.com/local.jpg',
				},
				gradient: 'linear-gradient(135deg, green 0%, yellow 100%)',
				backgroundSize: 'contain',
				backgroundPosition: '25% 75%',
			},
		} );
	} );

	it( 'combines inherited legacy color gradient with a local background image override', () => {
		expect(
			mergeInheritedBackgroundStyle(
				{
					background: {
						backgroundImage: {
							id: 2,
							url: 'http://example.com/local.jpg',
						},
					},
					color: {
						gradient: undefined,
					},
				},
				{
					color: {
						gradient:
							'linear-gradient(135deg, green 0%, yellow 100%)',
					},
				}
			)
		).toEqual( {
			background: {
				backgroundImage: {
					id: 2,
					url: 'http://example.com/local.jpg',
				},
				gradient: 'linear-gradient(135deg, green 0%, yellow 100%)',
			},
			color: {
				gradient: undefined,
			},
		} );
	} );

	it( 'preserves an explicit local background image removal', () => {
		expect(
			mergeInheritedBackgroundStyle(
				{
					background: {
						backgroundImage: 'none',
					},
				},
				{
					background: {
						backgroundImage: {
							id: 1,
							url: 'http://example.com/inherited.jpg',
						},
						gradient:
							'linear-gradient(135deg, green 0%, yellow 100%)',
					},
				}
			)
		).toEqual( {
			background: {
				backgroundImage: 'none',
				gradient: 'linear-gradient(135deg, green 0%, yellow 100%)',
			},
		} );
	} );
} );

/**
 * Tests for the inherited Global Styles label treatment in `BackgroundPanel`.
 * The visual treatment lands on the parent `ToolsPanelItem` of each slot via the
 * `.is-inherited-from-global-styles` /
 * `.has-local-override-from-global-styles` class hooks. Per-control
 * className wiring inside the popover sub-controls has been removed;
 * the inherited-state cue is conveyed once at the top label.
 *
 * Slot inventory:
 *
 * - **Background image** — renders `BackgroundImageControl`. The
 *   `ToolsPanelItem` carries the inheritance class hook based on
 *   whether `value.background.backgroundImage` is set vs. the
 *   inherited value.
 *
 * - **Background gradient** — renders `ColorPanelDropdown` (re-used
 *   from `color-panel.js`). The `ToolsPanelItem` is given the
 *   inheritance class hook; the inner `Dropdown`'s indicator still
 *   shows the inherited gradient at-rest, and the
 *   `ColorPanelTab.onChange` interceptor still commits the inherited
 *   value when the user clicks the active swatch.
 *
 * Inner sub-controls (size / repeat / attachment / focal point) are
 * intentionally untreated visually — the panel-level cue is enough
 * given they live behind a popover trigger.
 */

const baseSettings = {
	background: {
		backgroundImage: true,
		backgroundSize: true,
		gradient: true,
	},
	color: {
		gradients: {
			theme: [
				{
					name: 'Purple',
					slug: 'purple-blue',
					gradient:
						'linear-gradient(135deg, rgb(74, 0, 224) 0%, rgb(142, 45, 226) 100%)',
				},
			],
		},
	},
};

describe( 'BackgroundPanel — inherited Global Styles label treatment', () => {
	describe( 'Background gradient slot', () => {
		it( 'applies the inherited-label className when local is unset and inherited is defined', () => {
			const inheritedValue = {
				background: {
					gradient:
						'linear-gradient(135deg, rgb(74, 0, 224) 0%, rgb(142, 45, 226) 100%)',
				},
			};

			const { container } = render(
				<BackgroundPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ baseSettings }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const inheritedItems = container.querySelectorAll(
				'.is-inherited-from-global-styles'
			);
			expect( inheritedItems.length ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'applies the local-override className when a local gradient is set', () => {
			const inheritedValue = {
				background: {
					gradient:
						'linear-gradient(135deg, rgb(74, 0, 224) 0%, rgb(142, 45, 226) 100%)',
				},
			};
			const value = {
				background: {
					gradient:
						'linear-gradient(135deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)',
				},
			};

			const { container } = render(
				<BackgroundPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ baseSettings }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const overrideItems = container.querySelectorAll(
				'.has-local-override-from-global-styles'
			);
			expect( overrideItems.length ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'does not commit on mount when at-rest (display-without-commit)', () => {
			const inheritedValue = {
				background: {
					gradient:
						'linear-gradient(135deg, rgb(74, 0, 224) 0%, rgb(142, 45, 226) 100%)',
				},
			};
			const onChange = jest.fn();

			render(
				<BackgroundPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ baseSettings }
					onChange={ onChange }
					panelId="test-panel"
				/>
			);

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'falls back to legacy color.gradient inherited path when background.gradient is unset (still applies inherited-label class)', () => {
			const inheritedValue = {
				color: {
					gradient:
						'linear-gradient(135deg, rgb(74, 0, 224) 0%, rgb(142, 45, 226) 100%)',
				},
			};

			const { container } = render(
				<BackgroundPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ baseSettings }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const inheritedItems = container.querySelectorAll(
				'.is-inherited-from-global-styles'
			);
			expect( inheritedItems.length ).toBeGreaterThanOrEqual( 1 );
		} );
	} );

	describe( 'Background image slot', () => {
		it( 'applies the inherited-label className when local has no image but inherited does (bare picker path)', () => {
			const inheritedValue = {
				background: {
					backgroundImage: {
						id: 1,
						url: 'http://example.com/inherited.jpg',
						title: 'inherited.jpg',
						source: 'theme',
					},
				},
			};

			// Theme without backgroundSize / backgroundPosition /
			// backgroundRepeat support takes the bare-picker path
			// inside `BackgroundImagePanel` (the inner one in
			// `background-image-control/index.js`). The container
			// `<div>` carries the placeholder class directly.
			const settingsNoSize = {
				background: {
					backgroundImage: true,
					backgroundSize: false,
				},
			};
			const { container } = render(
				<BackgroundPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsNoSize }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const inheritedItems = container.querySelectorAll(
				'.is-inherited-from-global-styles'
			);
			expect( inheritedItems.length ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'applies the inherited-label className when size support is enabled and local image is unset (dropdown path)', () => {
			const inheritedValue = {
				background: {
					backgroundImage: {
						id: 1,
						url: 'http://example.com/inherited.jpg',
						title: 'inherited.jpg',
						source: 'theme',
					},
				},
			};

			const { container } = render(
				<BackgroundPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ baseSettings }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const inheritedItems = container.querySelectorAll(
				'.is-inherited-from-global-styles'
			);
			expect( inheritedItems.length ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'applies the local-override className when a local image is set', () => {
			const inheritedValue = {
				background: {
					backgroundImage: {
						id: 1,
						url: 'http://example.com/inherited.jpg',
					},
				},
			};
			const value = {
				background: {
					backgroundImage: {
						id: 2,
						url: 'http://example.com/local.jpg',
					},
				},
			};

			const settingsImageOnly = {
				background: {
					backgroundImage: true,
					backgroundSize: false,
				},
			};
			const { container } = render(
				<BackgroundPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ settingsImageOnly }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const overrideItems = container.querySelectorAll(
				'.has-local-override-from-global-styles'
			);
			expect( overrideItems.length ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'applies the local-override className when local explicitly removes the image (sentinel "none")', () => {
			const inheritedValue = {
				background: {
					backgroundImage: {
						id: 1,
						url: 'http://example.com/inherited.jpg',
					},
				},
			};
			const value = {
				background: {
					backgroundImage: 'none',
				},
			};

			const settingsImageOnly = {
				background: {
					backgroundImage: true,
					backgroundSize: false,
				},
			};
			const { container } = render(
				<BackgroundPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ settingsImageOnly }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// 'none' is a sentinel that the user explicitly removed
			// the inherited image. `hasBackgroundImageValue` treats
			// any string value as "set", so this counts as a local
			// override (the `has-local-override-from-global-styles`
			// class), not as an at-rest inherited state.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const inheritedItems = container.querySelectorAll(
				'.is-inherited-from-global-styles'
			);
			expect( inheritedItems ).toHaveLength( 0 );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const overrideItems = container.querySelectorAll(
				'.has-local-override-from-global-styles'
			);
			expect( overrideItems.length ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'does not commit on mount when at-rest (display-without-commit)', () => {
			const inheritedValue = {
				background: {
					backgroundImage: {
						id: 1,
						url: 'http://example.com/inherited.jpg',
					},
				},
			};
			const onChange = jest.fn();

			render(
				<BackgroundPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ baseSettings }
					onChange={ onChange }
					panelId="test-panel"
				/>
			);

			expect( onChange ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Background image inner sub-controls (display-without-commit only)', () => {
		// The panel-level inheritance class hook on the outer
		// ToolsPanelItem is sufficient. The inner sub-controls only need
		// to preserve display-without-commit behavior.
		it( 'does not commit on mount or popover open when at-rest (display-without-commit, sub-controls)', async () => {
			const user = userEvent.setup();

			const inheritedValue = {
				background: {
					backgroundImage: {
						id: 1,
						url: 'http://example.com/inherited.jpg',
					},
					backgroundSize: 'cover',
					backgroundRepeat: 'no-repeat',
					backgroundAttachment: 'fixed',
					backgroundPosition: '25% 75%',
				},
			};
			const value = {
				background: {
					backgroundImage: {
						id: 2,
						url: 'http://example.com/local.jpg',
					},
				},
			};
			const onChange = jest.fn();

			render(
				<BackgroundPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ baseSettings }
					onChange={ onChange }
					panelId="test-panel"
				/>
			);

			expect( onChange ).not.toHaveBeenCalled();

			// Opening the popover renders the inner sub-controls;
			// none of their value-prop reads must result in a
			// commit (display-without-commit invariant).
			const toggle = screen.getByRole( 'button', {
				name: /background size, position and repeat options/i,
			} );
			await user.click( toggle );

			expect( onChange ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'shape regression', () => {
		it( 'returns null when no controls are enabled', () => {
			const { container } = render(
				<BackgroundPanel
					value={ {} }
					inheritedValue={ {} }
					settings={ {
						background: {
							backgroundImage: false,
							gradient: false,
						},
					} }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);
			expect( container ).toBeEmptyDOMElement();
		} );
	} );
} );

describe( 'hasBackgroundColorValue', () => {
	it( 'should return `true` when a background color string is set', () => {
		expect(
			hasBackgroundColorValue( { color: { background: '#ff0000' } } )
		).toBe( true );
	} );

	it( 'should return `true` for a preset slug reference', () => {
		expect(
			hasBackgroundColorValue( {
				color: { background: 'var:preset|color|vivid-red' },
			} )
		).toBe( true );
	} );

	it( 'should return `false` when background color is undefined', () => {
		expect( hasBackgroundColorValue( { color: {} } ) ).toBe( false );
	} );

	it( 'should return `false` when color is undefined', () => {
		expect( hasBackgroundColorValue( {} ) ).toBe( false );
	} );

	it( 'should return `false` when style is undefined', () => {
		expect( hasBackgroundColorValue( undefined ) ).toBe( false );
	} );
} );

describe( 'hasLegacyColorGradientValue', () => {
	it( 'should return `true` when a legacy color.gradient string is set', () => {
		expect(
			hasLegacyColorGradientValue( {
				color: { gradient: 'linear-gradient(135deg, red, blue)' },
			} )
		).toBe( true );
	} );

	it( 'should return `false` when color.gradient is undefined', () => {
		expect( hasLegacyColorGradientValue( { color: {} } ) ).toBe( false );
	} );

	it( 'should return `false` when style is undefined', () => {
		expect( hasLegacyColorGradientValue( undefined ) ).toBe( false );
	} );

	it( 'should not be confused by background.gradient', () => {
		expect(
			hasLegacyColorGradientValue( {
				background: { gradient: 'linear-gradient(red, blue)' },
			} )
		).toBe( false );
	} );
} );
