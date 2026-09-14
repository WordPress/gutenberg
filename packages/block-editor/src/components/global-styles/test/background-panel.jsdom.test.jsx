import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackgroundPanel, {
	hasBackgroundImageValue,
	hasBackgroundGradientValue,
	hasBackgroundColorValue,
	hasLegacyColorGradientValue,
} from '../background-panel';
import BackgroundClipControl, {
	ALL_BACKGROUND_CLIP_VALUES,
} from '../../background-clip-control';

globalThis.wpVitest.mockMatchMedia();

globalThis.wpVitest.mockResizeObserver();

// The inheritance treatment sits behind the
// `gutenberg-global-styles-inheritance-ui` experiment. Turn it on so these
// tests exercise the inheriting path.
beforeEach( () => {
	window.__experimentalGlobalStylesInheritanceUI = true;
} );

afterEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

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

/**
 * Tests for the inherited Global Styles treatment in `BackgroundPanel`.
 *
 * Override state is asserted through the accessible "Reset to inherited
 * value" button.
 *
 * Slot inventory:
 *
 * - Background image: renders `BackgroundImageControl`. Exposes an
 *   accessible reset button only when size/position/repeat settings are
 *   enabled.
 *
 * - Background gradient: renders `ColorPanelDropdown` (re-used from
 *   `color-panel.jsx`). The inner `Dropdown` indicator shows the inherited
 *   gradient at-rest, and the `ColorPanelTab.onChange` interceptor commits
 *   the inherited value when the user clicks the active swatch.
 *
 * Inner sub-controls (size / repeat / attachment / focal point) only need
 * to preserve display-without-commit behaviour.
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

describe( 'BackgroundPanel — duplicate gradient preset slug identity', () => {
	const SHARED_GRADIENT =
		'linear-gradient(135deg, rgb(74, 0, 224) 0%, rgb(142, 45, 226) 100%)';
	const duplicateGradientSettings = {
		background: {
			gradient: true,
		},
		color: {
			gradients: {
				theme: [
					{
						name: 'Dark background',
						slug: 'dup-background',
						gradient: SHARED_GRADIENT,
					},
					{
						name: 'Dark text',
						slug: 'dup-text',
						gradient: SHARED_GRADIENT,
					},
				],
			},
		},
	};

	async function openGradientDropdown( user ) {
		await user.click( screen.getByRole( 'button', { name: /Gradient/ } ) );
		return screen.findAllByRole( 'option' );
	}

	it( 'commits the inherited preset slug when accepting the preselected inherited gradient', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		render(
			<BackgroundPanel
				value={ {} }
				inheritedValue={ {
					background: { gradient: 'var:preset|gradient|dup-text' },
				} }
				settings={ duplicateGradientSettings }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		const swatches = await openGradientDropdown( user );
		// swatch[1] ('Dark text') is the preselected inherited option;
		// activating it is the "accept inherited value" gesture. The commit
		// must carry the inherited slug, not re-encode the shared gradient
		// string to whichever duplicate appears first.
		await user.click( swatches[ 1 ] );

		const result = onChange.mock.calls[ 0 ][ 0 ];
		expect( result?.background?.gradient ).toBe(
			'var:preset|gradient|dup-text'
		);
	} );

	it( 'marks only the local preset as selected when another preset shares its gradient', async () => {
		const user = userEvent.setup();

		render(
			<BackgroundPanel
				value={ {
					background: { gradient: 'var:preset|gradient|dup-text' },
				} }
				inheritedValue={ {} }
				settings={ duplicateGradientSettings }
				onChange={ vi.fn() }
				panelId="test-panel"
			/>
		);

		// swatch[0] = 'Dark background', swatch[1] = 'Dark text'. Selection
		// must follow the stored slug; matching by gradient string would
		// mark both.
		const swatches = await openGradientDropdown( user );
		expect( swatches[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		expect( swatches[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
	} );
} );

describe( 'BackgroundPanel — inherited Global Styles label treatment', () => {
	describe( 'Background gradient slot', () => {
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

			render(
				<BackgroundPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ baseSettings }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			expect(
				screen.getAllByRole( 'button', {
					name: /reset to inherited value/i,
				} ).length
			).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'does not commit on mount when at-rest (display-without-commit)', () => {
			const inheritedValue = {
				background: {
					gradient:
						'linear-gradient(135deg, rgb(74, 0, 224) 0%, rgb(142, 45, 226) 100%)',
				},
			};
			const onChange = vi.fn();

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

	describe( 'Background image slot', () => {
		it( 'exposes an accessible reset-to-inherited button when size/position/repeat settings are enabled', () => {
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

			render(
				<BackgroundPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ {
						background: {
							backgroundImage: true,
							backgroundSize: true,
						},
					} }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			expect(
				screen.getByRole( 'button', {
					name: /reset to inherited value/i,
				} )
			).toBeInTheDocument();
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
			const onChange = vi.fn();

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
			const onChange = vi.fn();

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

describe( 'BackgroundPanel background clip', () => {
	const withClipSetting = ( backgroundClip ) => ( {
		...baseSettings,
		background: { ...baseSettings.background, backgroundClip },
	} );

	const renderPanel = ( settings ) =>
		render(
			<BackgroundPanel
				value={ {} }
				settings={ settings }
				onChange={ () => {} }
				defaultControls={ { backgroundClip: true } }
				panelId="test-panel"
			/>
		);

	it( 'hides the clip control until a theme opts in', () => {
		renderPanel( baseSettings );

		expect(
			screen.queryByRole( 'combobox', { name: /clip/i } )
		).not.toBeInTheDocument();
	} );

	it( 'shows the clip control when the setting is true', async () => {
		renderPanel( withClipSetting( true ) );

		expect(
			await screen.findByRole( 'combobox', { name: /clip/i } )
		).toBeInTheDocument();
	} );

	it( 'shows the clip control when the setting names values', async () => {
		renderPanel( withClipSetting( [ 'border-box', 'text' ] ) );

		expect(
			await screen.findByRole( 'combobox', { name: /clip/i } )
		).toBeInTheDocument();
	} );
} );

describe( 'BackgroundClipControl', () => {
	it( 'falls back to the first allowed value when nothing is set', async () => {
		render(
			<BackgroundClipControl
				onChange={ () => {} }
				allowedValues={ [ 'padding-box', 'text' ] }
			/>
		);

		expect(
			await screen.findByRole( 'combobox', { name: /clip/i } )
		).toHaveTextContent( 'Padding box' );
	} );

	it( 'shows the current value', async () => {
		render(
			<BackgroundClipControl
				value="text"
				onChange={ () => {} }
				allowedValues={ ALL_BACKGROUND_CLIP_VALUES }
			/>
		);

		expect(
			await screen.findByRole( 'combobox', { name: /clip/i } )
		).toHaveTextContent( 'Text' );
	} );

	it( 'renders nothing when no values are allowed', () => {
		const { container } = render(
			<BackgroundClipControl onChange={ () => {} } allowedValues={ [] } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );

describe( 'BackgroundPanel text gradient ownership', () => {
	const TEXT_GRADIENT = 'var:preset|gradient|purple-blue';
	// A text gradient alongside a value this panel does own, so "Reset all"
	// has something of its own to clear.
	const mixedValue = {
		background: {
			gradient: TEXT_GRADIENT,
			backgroundClip: 'text',
			backgroundImage: { url: 'https://example.com/image.jpg' },
		},
	};

	const resetAll = async ( user ) => {
		await user.click(
			screen.getByRole( 'button', { name: 'Background options' } )
		);
		await user.click(
			screen.getByRole( 'menuitem', { name: /reset all/i } )
		);
	};

	it( 'does not count a text gradient as the panel gradient value', () => {
		render(
			<BackgroundPanel
				value={ {
					background: {
						gradient: TEXT_GRADIENT,
						backgroundClip: 'text',
					},
				} }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// With no value of its own, the gradient item offers no reset control.
		expect(
			screen.queryByRole( 'button', { name: /^reset$/i } )
		).not.toBeInTheDocument();
	} );

	it( 'disables the gradient control while a text gradient is set', () => {
		render(
			<BackgroundPanel
				value={ {
					background: {
						gradient: TEXT_GRADIENT,
						backgroundClip: 'text',
					},
				} }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// The control stays focusable so its tooltip remains reachable.
		expect(
			screen.getByRole( 'button', { name: 'Gradient' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'disables the gradient control while a text gradient is inherited', () => {
		render(
			<BackgroundPanel
				value={ {} }
				inheritedValue={ {
					background: {
						gradient: TEXT_GRADIENT,
						backgroundClip: 'text',
					},
				} }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Gradient' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'keeps the gradient control usable for a text gradient built here', async () => {
		const user = userEvent.setup();
		const clipSettings = {
			...baseSettings,
			background: { ...baseSettings.background, backgroundClip: true },
		};
		let current = {};
		const onChange = ( next ) => {
			current = next;
		};
		const panel = ( value ) => (
			<BackgroundPanel
				value={ value }
				settings={ clipSettings }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);
		const { rerender } = render( panel( current ) );

		const enable = async ( name ) => {
			await user.click(
				screen.getByRole( 'button', { name: 'Background options' } )
			);
			await user.click(
				screen.getByRole( 'menuitemcheckbox', { name } )
			);
			await user.keyboard( '{Escape}' );
		};

		await enable( /gradient/i );
		await user.click( screen.getByRole( 'button', { name: 'Gradient' } ) );
		await user.click( screen.getByRole( 'option', { name: /purple/i } ) );
		await user.keyboard( '{Escape}' );
		expect( current.background.gradient ).toBeTruthy();

		await enable( /clip/i );
		// The clip select needs real layout to open, so the value it would
		// write is applied directly. What matters here is that both controls
		// were opted into before the gradient became a text gradient.
		rerender(
			panel( {
				...current,
				background: { ...current.background, backgroundClip: 'text' },
			} )
		);

		const gradientToggle = screen.getByRole( 'button', {
			name: 'Gradient',
		} );
		expect( gradientToggle ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'combobox', { name: /clip/i } )
		).toBeInTheDocument();

		// The gradient is still the control's own, so its swatch stays picked.
		await user.click( gradientToggle );
		expect(
			screen.getByRole( 'option', { name: /purple/i } )
		).toHaveAttribute( 'aria-selected', 'true' );
	} );

	it( 'preserves a text gradient through Reset all while the clip control is hidden', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<BackgroundPanel
				value={ mixedValue }
				settings={ baseSettings }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		await resetAll( user );

		const result = onChange.mock.calls.at( -1 )[ 0 ];
		expect( result.background.gradient ).toBe( TEXT_GRADIENT );
		expect( result.background.backgroundClip ).toBe( 'text' );
		expect( result.background.backgroundImage ).toBeUndefined();
	} );

	it( 'clears a text gradient through Reset all once the clip control is shown', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<BackgroundPanel
				value={ mixedValue }
				settings={ {
					...baseSettings,
					background: {
						...baseSettings.background,
						backgroundClip: true,
					},
				} }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		await resetAll( user );

		const result = onChange.mock.calls.at( -1 )[ 0 ];
		expect( result.background.gradient ).toBeUndefined();
		expect( result.background.backgroundClip ).toBeUndefined();
	} );
} );

describe( 'BackgroundPanel clip control ownership', () => {
	const clipSettings = {
		...baseSettings,
		background: { ...baseSettings.background, backgroundClip: true },
	};

	it( 'does not surface the clip control for a text gradient set elsewhere', () => {
		render(
			<BackgroundPanel
				value={ {
					background: {
						gradient: 'var:preset|gradient|purple-blue',
						backgroundClip: 'text',
					},
				} }
				settings={ clipSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// The Typography panel owns a text clip, so this panel reports no
		// value for it and the control stays behind the menu.
		expect(
			screen.queryByRole( 'combobox', { name: /clip/i } )
		).not.toBeInTheDocument();
	} );

	it( 'surfaces the clip control for a box value set here', async () => {
		render(
			<BackgroundPanel
				value={ { background: { backgroundClip: 'content-box' } } }
				settings={ clipSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		expect(
			await screen.findByRole( 'combobox', { name: /clip/i } )
		).toBeInTheDocument();
	} );
} );
