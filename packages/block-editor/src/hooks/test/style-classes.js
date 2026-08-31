/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { withStyleClasses } from '../style-classes';

jest.mock( '../../store', () => ( {
	store: { name: 'core/block-editor' },
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	combineReducers: jest.fn( ( reducers ) => reducers ),
	registerStore: jest.fn(),
	createRegistrySelector: jest.fn(),
	useDispatch: jest.fn(),
	useRegistry: jest.fn(),
} ) );

jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn(),
	addFilter: jest.fn(),
} ) );

describe( 'withStyleClasses', () => {
	const MockBlockListBlock = ( props ) => {
		return (
			<div
				data-testid="mock-block"
				className={ props.wrapperProps?.className }
			/>
		);
	};

	const EnhancedBlock = withStyleClasses( MockBlockListBlock );

	beforeEach( () => {
		useSelect.mockImplementation( ( callback ) => {
			return callback( () => ( {
				getSettings: () => ( {
					__experimentalStyleClassesEnabled: [
						'padding',
						'margin',
						'block-gap',
						'border-radius',
						'border-width',
						'border-style',
						'border-color',
						'font-size',
						'font-weight',
						'shadow',
						'aspect-ratio',
						'min-height',
						'color-background',
						'color-text',
						'font-family',
					],
				} ),
			} ) );
		} );

		applyFilters.mockImplementation( ( hookName, val ) => val );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'bails out gracefully if no styles are present', () => {
		const props = {
			name: 'core/group',
			attributes: {},
			wrapperProps: { className: 'original-class' },
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass( 'original-class' );
		expect( block ).toHaveClass( 'original-class', { exact: true } );
	} );

	it( 'generates accurate spacing classes for uniform and mixed sides', () => {
		const props = {
			name: 'core/group',
			attributes: {
				style: {
					spacing: {
						padding: 'var:preset|spacing|80',
						margin: {
							top: '20px',
							bottom: 'var:preset|spacing|40',
						},
					},
				},
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass( 'has-padding', 'has-80-padding' );
		expect( block ).toHaveClass(
			'has-margin',
			'has-mixed-margin',
			'has-custom-top-margin',
			'has-40-bottom-margin'
		);
	} );

	it( 'generates axial classes for block-gap', () => {
		const props = {
			name: 'core/group',
			attributes: {
				style: {
					spacing: {
						blockGap: {
							horizontal: 'var:preset|spacing|20',
							vertical: '50px',
						},
					},
				},
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass(
			'has-block-gap',
			'has-20-horizontal-block-gap',
			'has-custom-vertical-block-gap'
		);
	} );

	it( 'collapses border radius to uniform class when all corners are identical', () => {
		const props = {
			name: 'core/group',
			attributes: {
				style: {
					border: {
						radius: {
							topLeft: '100px',
							topRight: '100px',
							bottomLeft: '100px',
							bottomRight: '100px',
						},
					},
				},
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass(
			'has-border-radius',
			'has-custom-border-radius'
		);
		expect( block ).not.toHaveClass( 'has-mixed-border-radius' );
	} );

	it( 'embeds raw values for border style but uses custom for width', () => {
		const props = {
			name: 'core/group',
			attributes: {
				style: {
					border: {
						style: 'dashed',
						width: '2px',
					},
				},
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass(
			'has-border-style',
			'has-dashed-border-style'
		);
		expect( block ).toHaveClass(
			'has-border-width',
			'has-custom-border-width'
		);
	} );

	it( 'generates mixed side classes for border width', () => {
		const props = {
			name: 'core/group',
			attributes: {
				style: {
					border: {
						top: { width: '2px' },
						bottom: { width: 'var:preset|spacing|40' },
					},
				},
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass(
			'has-border-width',
			'has-mixed-border-width',
			'has-custom-top-border-width',
			'has-40-bottom-border-width'
		);
	} );

	it( 'reads typography from both top-level attributes and the style object', () => {
		const props = {
			name: 'core/paragraph',
			attributes: {
				fontSize: 'large',
				style: { typography: { fontWeight: 'bold' } },
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass( 'has-font-size', 'has-large-font-size' );
		expect( block ).toHaveClass(
			'has-font-weight',
			'has-bold-font-weight'
		);
	} );

	it( 'maps aspect ratio and min-height correctly', () => {
		const props = {
			name: 'core/cover',
			attributes: {
				style: {
					dimensions: {
						aspectRatio: '16/9',
						minHeight: '50vh',
					},
				},
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass(
			'has-aspect-ratio',
			'has-16-9-aspect-ratio'
		);
		expect( block ).toHaveClass(
			'has-min-height',
			'has-custom-min-height'
		);
	} );

	it( 'maps custom colors correctly', () => {
		const props = {
			name: 'core/group',
			attributes: {
				style: {
					color: {
						background: '#ff0000',
						text: 'var:preset|color|primary',
					},
				},
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass(
			'has-background',
			'has-custom-background'
		);
		expect( block ).toHaveClass( 'has-color', 'has-primary-color' );
	} );

	it( 'extracts CSS variables and deduplicates overlapping class names', () => {
		const props = {
			name: 'core/group',
			attributes: {
				style: { shadow: 'var(--wp--preset--shadow--natural)' },
			},
			wrapperProps: { className: 'has-shadow' },
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass( 'has-natural-shadow' );
		expect( block ).toHaveClass( 'has-shadow has-natural-shadow', {
			exact: true,
		} );
	} );

	it( 'honors JS block-specific exclusion filters', () => {
		// Mock applyFilters to strip 'margin' from core/image blocks
		applyFilters.mockImplementation( ( hookName, val ) => {
			if ( hookName === 'editor.enabledStyleProperties.core/image' ) {
				return val.filter( ( p ) => p !== 'margin' );
			}
			return val;
		} );

		const props = {
			name: 'core/image',
			attributes: {
				style: {
					spacing: { padding: '20px', margin: '20px' },
				},
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass( 'has-padding' );
		expect( block ).not.toHaveClass( 'has-margin' );
	} );

	it( 'honors JS final class injection filters', () => {
		applyFilters.mockImplementation( ( hookName, val, blockProps ) => {
			if (
				hookName === 'editor.blockStyleClasses' &&
				blockProps.name === 'core/group'
			) {
				return [ ...val, 'my-js-injected-class' ];
			}
			return val;
		} );

		const props = {
			name: 'core/group',
			attributes: { style: { shadow: 'var:preset|shadow|natural' } },
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass(
			'has-natural-shadow',
			'my-js-injected-class'
		);
	} );

	it( 'handles completely missing attributes gracefully', () => {
		const props = { name: 'core/group' };
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );
		expect( block ).toHaveClass( '', { exact: true } );
	} );

	it( 'ignores empty string sides in complex arrays', () => {
		const props = {
			name: 'core/group',
			attributes: {
				style: {
					spacing: {
						margin: { top: '20px', bottom: '', left: null },
					},
				},
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass(
			'has-margin',
			'has-mixed-margin',
			'has-custom-top-margin'
		);
		expect( block ).not.toHaveClass( 'has-custom-bottom-margin' );
	} );

	it( 'falls back to custom if preset string is malformed', () => {
		const props = {
			name: 'core/group',
			attributes: {
				style: { spacing: { padding: 'var:preset|spacing' } },
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass( 'has-padding', 'has-custom-padding' );
	} );

	it( 'sanitizes weird text into valid CSS kebab-case classes', () => {
		const props = {
			name: 'core/heading',
			attributes: {
				style: { typography: { fontWeight: 'Super Heavy!' } },
			},
		};
		render( <EnhancedBlock { ...props } /> );
		const block = screen.getByTestId( 'mock-block' );

		expect( block ).toHaveClass(
			'has-font-weight',
			'has-super-heavy-font-weight'
		);
	} );
} );
