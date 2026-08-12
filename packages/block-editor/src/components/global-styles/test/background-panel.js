import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackgroundPanel, {
	hasBackgroundImageValue,
	hasBackgroundGradientValue,
	hasBackgroundColorValue,
	hasLegacyColorGradientValue,
} from '../background-panel';

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
 *   `color-panel.js`). The inner `Dropdown` indicator shows the inherited
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
		const onChange = jest.fn();

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
				onChange={ jest.fn() }
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
