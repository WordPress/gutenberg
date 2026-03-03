/**
 * Internal dependencies
 */
import {
	buildProviderStyleVars,
	buildInheritorCSS,
} from '../style-inheritance';

describe( 'buildProviderStyleVars', () => {
	describe( 'color group', () => {
		it( 'returns preset var for named textColor', () => {
			const vars = buildProviderStyleVars( [ 'color' ], {
				textColor: 'vivid-red',
			} );
			expect( vars[ '--wp--inherited--color--text' ] ).toBe(
				'var(--wp--preset--color--vivid-red)'
			);
		} );

		it( 'returns raw value for custom textColor', () => {
			const vars = buildProviderStyleVars( [ 'color' ], {
				style: { color: { text: '#ff0000' } },
			} );
			expect( vars[ '--wp--inherited--color--text' ] ).toBe( '#ff0000' );
		} );

		it( 'prefers named attribute over style object for textColor', () => {
			const vars = buildProviderStyleVars( [ 'color' ], {
				textColor: 'vivid-red',
				style: { color: { text: '#ff0000' } },
			} );
			expect( vars[ '--wp--inherited--color--text' ] ).toBe(
				'var(--wp--preset--color--vivid-red)'
			);
		} );

		it( 'returns preset var for named backgroundColor', () => {
			const vars = buildProviderStyleVars( [ 'color' ], {
				backgroundColor: 'vivid-cyan-blue',
			} );
			expect( vars[ '--wp--inherited--color--background' ] ).toBe(
				'var(--wp--preset--color--vivid-cyan-blue)'
			);
		} );

		it( 'returns preset var for named gradient', () => {
			const vars = buildProviderStyleVars( [ 'color' ], {
				gradient: 'vivid-cyan-blue-to-vivid-purple',
			} );
			expect( vars[ '--wp--inherited--color--gradient' ] ).toBe(
				'var(--wp--preset--gradient--vivid-cyan-blue-to-vivid-purple)'
			);
		} );

		it( 'returns link color from style.elements', () => {
			const vars = buildProviderStyleVars( [ 'color' ], {
				style: { elements: { link: { color: { text: '#0000ff' } } } },
			} );
			expect( vars[ '--wp--inherited--color--link' ] ).toBe( '#0000ff' );
		} );

		it( 'returns empty object when color group not in provides', () => {
			const vars = buildProviderStyleVars( [ 'typography' ], {
				textColor: 'vivid-red',
			} );
			expect( vars[ '--wp--inherited--color--text' ] ).toBeUndefined();
		} );

		it( 'returns empty object when no color attributes are set', () => {
			const vars = buildProviderStyleVars( [ 'color' ], {} );
			expect( vars ).toEqual( {} );
		} );
	} );

	describe( 'typography group', () => {
		it( 'returns preset var for named fontSize', () => {
			const vars = buildProviderStyleVars( [ 'typography' ], {
				fontSize: 'large',
			} );
			expect( vars[ '--wp--inherited--typography--font-size' ] ).toBe(
				'var(--wp--preset--font-size--large)'
			);
		} );

		it( 'returns raw value for custom fontSize', () => {
			const vars = buildProviderStyleVars( [ 'typography' ], {
				style: { typography: { fontSize: '1.5rem' } },
			} );
			expect( vars[ '--wp--inherited--typography--font-size' ] ).toBe(
				'1.5rem'
			);
		} );

		it( 'returns preset var for named fontFamily', () => {
			const vars = buildProviderStyleVars( [ 'typography' ], {
				fontFamily: 'inter',
			} );
			expect( vars[ '--wp--inherited--typography--font-family' ] ).toBe(
				'var(--wp--preset--font-family--inter)'
			);
		} );

		it( 'returns style values for font-weight, line-height, letter-spacing, text-transform, text-decoration', () => {
			const vars = buildProviderStyleVars( [ 'typography' ], {
				style: {
					typography: {
						fontWeight: '700',
						lineHeight: '1.5',
						letterSpacing: '0.05em',
						textTransform: 'uppercase',
						textDecoration: 'underline',
					},
				},
			} );
			expect( vars[ '--wp--inherited--typography--font-weight' ] ).toBe(
				'700'
			);
			expect( vars[ '--wp--inherited--typography--line-height' ] ).toBe(
				'1.5'
			);
			expect(
				vars[ '--wp--inherited--typography--letter-spacing' ]
			).toBe( '0.05em' );
			expect(
				vars[ '--wp--inherited--typography--text-transform' ]
			).toBe( 'uppercase' );
			expect(
				vars[ '--wp--inherited--typography--text-decoration' ]
			).toBe( 'underline' );
		} );
	} );

	describe( 'spacing group', () => {
		it( 'returns padding vars', () => {
			const vars = buildProviderStyleVars( [ 'spacing' ], {
				style: {
					spacing: {
						padding: {
							top: '10px',
							right: '20px',
							bottom: '10px',
							left: '20px',
						},
					},
				},
			} );
			expect( vars[ '--wp--inherited--spacing--padding-top' ] ).toBe(
				'10px'
			);
			expect( vars[ '--wp--inherited--spacing--padding-right' ] ).toBe(
				'20px'
			);
			expect( vars[ '--wp--inherited--spacing--padding-bottom' ] ).toBe(
				'10px'
			);
			expect( vars[ '--wp--inherited--spacing--padding-left' ] ).toBe(
				'20px'
			);
		} );

		it( 'returns margin vars', () => {
			const vars = buildProviderStyleVars( [ 'spacing' ], {
				style: {
					spacing: {
						margin: { top: '5px', bottom: '5px' },
					},
				},
			} );
			expect( vars[ '--wp--inherited--spacing--margin-top' ] ).toBe(
				'5px'
			);
			expect( vars[ '--wp--inherited--spacing--margin-bottom' ] ).toBe(
				'5px'
			);
			expect(
				vars[ '--wp--inherited--spacing--margin-right' ]
			).toBeUndefined();
		} );
	} );

	describe( 'border group', () => {
		it( 'returns border vars', () => {
			const vars = buildProviderStyleVars( [ 'border' ], {
				style: {
					border: {
						color: '#000',
						width: '1px',
						radius: '4px',
						style: 'solid',
					},
				},
			} );
			expect( vars[ '--wp--inherited--border--color' ] ).toBe( '#000' );
			expect( vars[ '--wp--inherited--border--width' ] ).toBe( '1px' );
			expect( vars[ '--wp--inherited--border--radius' ] ).toBe( '4px' );
			expect( vars[ '--wp--inherited--border--style' ] ).toBe( 'solid' );
		} );
	} );

	describe( 'multiple groups', () => {
		it( 'returns vars for all requested groups', () => {
			const vars = buildProviderStyleVars( [ 'color', 'typography' ], {
				textColor: 'vivid-red',
				fontSize: 'large',
			} );
			expect( vars[ '--wp--inherited--color--text' ] ).toBe(
				'var(--wp--preset--color--vivid-red)'
			);
			expect( vars[ '--wp--inherited--typography--font-size' ] ).toBe(
				'var(--wp--preset--font-size--large)'
			);
		} );
	} );
} );

describe( 'buildInheritorCSS', () => {
	const selector = '.wp-style-inherit-1';

	describe( 'color group', () => {
		it( 'emits color: inherit when text color var is set', () => {
			const css = buildInheritorCSS( selector, [ 'color' ], {
				'--wp--inherited--color--text':
					'var(--wp--preset--color--vivid-red)',
			} );
			expect( css ).toContain( 'color: inherit !important;' );
		} );

		it( 'emits background-color var when background var is set', () => {
			const css = buildInheritorCSS( selector, [ 'color' ], {
				'--wp--inherited--color--background':
					'var(--wp--preset--color--vivid-cyan-blue)',
			} );
			expect( css ).toContain(
				'background-color: var(--wp--inherited--color--background) !important;'
			);
		} );

		it( 'emits background var when gradient var is set', () => {
			const css = buildInheritorCSS( selector, [ 'color' ], {
				'--wp--inherited--color--gradient':
					'linear-gradient(red, blue)',
			} );
			expect( css ).toContain(
				'background: var(--wp--inherited--color--gradient) !important;'
			);
		} );

		it( 'returns empty string when no vars are set for the group', () => {
			const css = buildInheritorCSS( selector, [ 'color' ], {} );
			expect( css ).toBe( '' );
		} );
	} );

	describe( 'typography group', () => {
		it( 'emits inherit rules for all set typography vars', () => {
			const css = buildInheritorCSS( selector, [ 'typography' ], {
				'--wp--inherited--typography--font-size':
					'var(--wp--preset--font-size--large)',
				'--wp--inherited--typography--font-family':
					'var(--wp--preset--font-family--inter)',
				'--wp--inherited--typography--font-weight': '700',
				'--wp--inherited--typography--line-height': '1.5',
				'--wp--inherited--typography--letter-spacing': '0.05em',
				'--wp--inherited--typography--text-transform': 'uppercase',
				'--wp--inherited--typography--text-decoration': 'underline',
			} );
			expect( css ).toContain( 'font-size: inherit !important;' );
			expect( css ).toContain( 'font-family: inherit !important;' );
			expect( css ).toContain( 'font-weight: inherit !important;' );
			expect( css ).toContain( 'line-height: inherit !important;' );
			expect( css ).toContain( 'letter-spacing: inherit !important;' );
			expect( css ).toContain( 'text-transform: inherit !important;' );
			expect( css ).toContain( 'text-decoration: inherit !important;' );
		} );
	} );

	describe( 'spacing group', () => {
		it( 'emits var() references for padding', () => {
			const css = buildInheritorCSS( selector, [ 'spacing' ], {
				'--wp--inherited--spacing--padding-top': '10px',
				'--wp--inherited--spacing--padding-right': '20px',
				'--wp--inherited--spacing--padding-bottom': '10px',
				'--wp--inherited--spacing--padding-left': '20px',
			} );
			expect( css ).toContain(
				'padding-top: var(--wp--inherited--spacing--padding-top) !important;'
			);
			expect( css ).toContain(
				'padding-right: var(--wp--inherited--spacing--padding-right) !important;'
			);
			expect( css ).toContain(
				'padding-bottom: var(--wp--inherited--spacing--padding-bottom) !important;'
			);
			expect( css ).toContain(
				'padding-left: var(--wp--inherited--spacing--padding-left) !important;'
			);
		} );
	} );

	describe( 'border group', () => {
		it( 'emits var() references for border properties', () => {
			const css = buildInheritorCSS( selector, [ 'border' ], {
				'--wp--inherited--border--color': '#000',
				'--wp--inherited--border--width': '1px',
				'--wp--inherited--border--radius': '4px',
				'--wp--inherited--border--style': 'solid',
			} );
			expect( css ).toContain(
				'border-color: var(--wp--inherited--border--color) !important;'
			);
			expect( css ).toContain(
				'border-width: var(--wp--inherited--border--width) !important;'
			);
			expect( css ).toContain(
				'border-radius: var(--wp--inherited--border--radius) !important;'
			);
			expect( css ).toContain(
				'border-style: var(--wp--inherited--border--style) !important;'
			);
		} );
	} );

	describe( 'output format', () => {
		it( 'wraps rules in the given selector', () => {
			const css = buildInheritorCSS( selector, [ 'color' ], {
				'--wp--inherited--color--text': 'red',
			} );
			expect( css ).toMatch( /^\.wp-style-inherit-1 \{/ );
			expect( css ).toMatch( /\}$/ );
		} );

		it( 'returns empty string when activeGroups is empty', () => {
			const css = buildInheritorCSS( selector, [], {
				'--wp--inherited--color--text': 'red',
			} );
			expect( css ).toBe( '' );
		} );

		it( 'does not emit rules for groups not in activeGroups', () => {
			const css = buildInheritorCSS( selector, [ 'typography' ], {
				'--wp--inherited--color--text': 'red',
				'--wp--inherited--typography--font-size':
					'var(--wp--preset--font-size--large)',
			} );
			expect( css ).not.toContain( 'color:' );
			expect( css ).toContain( 'font-size: inherit !important;' );
		} );
	} );
} );
