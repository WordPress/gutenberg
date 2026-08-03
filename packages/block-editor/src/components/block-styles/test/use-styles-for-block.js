/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { addFilter, removeAllFilters } from '@wordpress/hooks';
import { useSelect, useDispatch, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useStylesForBlocks from '../use-styles-for-block';

jest.mock( '../../../store', () => ( {
	store: 'core/block-editor',
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	store: 'core/blocks',
	getBlockType: jest.fn(),
	cloneBlock: jest.fn(),
	getBlockFromExample: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	select: jest.fn(),
} ) );

describe( 'useStylesForBlocks', () => {
	beforeEach( () => {
		useDispatch.mockImplementation( () => ( {
			updateBlockAttributes: jest.fn(),
		} ) );

		useSelect.mockImplementation( () => ( {
			styles: [
				{ name: 'default', label: 'Default', isDefault: true },
				{ name: 'outline', label: 'Outline' },
			],
			block: { name: 'core/button' },
			blockName: 'core/button',
			blockType: {},
			className: '',
		} ) );

		select.mockImplementation( ( storeName ) => {
			if ( storeName === 'core/block-editor' ) {
				return {
					getBlockAttributes: ( id ) =>
						id === 'test-id'
							? { className: 'is-style-card-variation' }
							: {},
					getBlockParentsByBlockName: ( id, name ) =>
						name === 'core/cover' ? [ 'parent-id' ] : [],
				};
			}
			if ( storeName === 'core/editor' ) {
				return {
					getCurrentPostType: () => 'page',
				};
			}
			if ( storeName === 'core' ) {
				return {
					canUser: () => false,
				};
			}
			return {};
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
		removeAllFilters( 'blockEditor.useStylesForBlock' );
	} );

	it( 'returns styles unmodified by default', () => {
		const { result } = renderHook( () =>
			useStylesForBlocks( { clientId: 'test-id', onSwitch: jest.fn() } )
		);
		expect( result.current.stylesToRender ).toHaveLength( 2 );
	} );

	it( 'filters styles based on block attributes', () => {
		addFilter(
			'blockEditor.useStylesForBlock',
			'test/filter-by-attribute',
			( styles, blockName, clientId ) => {
				const attributes =
					select( 'core/block-editor' ).getBlockAttributes(
						clientId
					);
				if (
					attributes?.className?.includes( 'is-style-card-variation' )
				) {
					return styles.filter(
						( style ) => style.name !== 'outline'
					);
				}
				return styles;
			}
		);

		const { result } = renderHook( () =>
			useStylesForBlocks( { clientId: 'test-id', onSwitch: jest.fn() } )
		);

		expect( result.current.stylesToRender ).toHaveLength( 1 );
		expect( result.current.stylesToRender[ 0 ].name ).toBe( 'default' );
	} );

	it( 'filters styles based on parent/ancestor blocks', () => {
		addFilter(
			'blockEditor.useStylesForBlock',
			'test/filter-by-parent',
			( styles, blockName, clientId ) => {
				const coverParents = select(
					'core/block-editor'
				).getBlockParentsByBlockName( clientId, 'core/cover' );
				if ( coverParents.length > 0 ) {
					return styles.filter(
						( style ) => style.name !== 'outline'
					);
				}
				return styles;
			}
		);

		const { result } = renderHook( () =>
			useStylesForBlocks( { clientId: 'test-id', onSwitch: jest.fn() } )
		);

		expect( result.current.stylesToRender ).toHaveLength( 1 );
		expect( result.current.stylesToRender[ 0 ].name ).toBe( 'default' );
	} );

	it( 'filters styles based on editor context', () => {
		addFilter(
			'blockEditor.useStylesForBlock',
			'test/filter-by-post-type',
			( styles ) => {
				const postType = select( 'core/editor' ).getCurrentPostType();
				if ( postType === 'page' ) {
					return styles.filter(
						( style ) => style.name !== 'outline'
					);
				}
				return styles;
			}
		);

		const { result } = renderHook( () =>
			useStylesForBlocks( { clientId: 'test-id', onSwitch: jest.fn() } )
		);

		expect( result.current.stylesToRender ).toHaveLength( 1 );
	} );

	it( 'can modify existing styles or append new ones', () => {
		addFilter(
			'blockEditor.useStylesForBlock',
			'test/modify-styles',
			( styles ) => {
				const modifiedStyles = styles.map( ( style ) => {
					if ( style.name === 'default' ) {
						return { ...style, label: 'Super Default' };
					}
					return style;
				} );

				modifiedStyles.push( {
					name: 'injected',
					label: 'Injected Style',
				} );
				return modifiedStyles;
			}
		);

		const { result } = renderHook( () =>
			useStylesForBlocks( { clientId: 'test-id', onSwitch: jest.fn() } )
		);

		expect( result.current.stylesToRender ).toHaveLength( 3 );
		expect( result.current.stylesToRender[ 0 ].label ).toBe(
			'Super Default'
		);
		expect( result.current.stylesToRender[ 2 ].name ).toBe( 'injected' );
	} );

	it( 'can disable the styles panel completely by returning an empty array', () => {
		addFilter(
			'blockEditor.useStylesForBlock',
			'test/disable-all-styles',
			() => []
		);

		const { result } = renderHook( () =>
			useStylesForBlocks( { clientId: 'test-id', onSwitch: jest.fn() } )
		);

		expect( result.current.stylesToRender ).toHaveLength( 0 );
	} );

	it( 'filters styles based on user permissions', () => {
		addFilter(
			'blockEditor.useStylesForBlock',
			'test/filter-by-permission',
			( styles ) => {
				const canPublish = select( 'core' ).canUser(
					'create',
					'posts'
				);
				if ( ! canPublish ) {
					return styles.filter(
						( style ) => style.name !== 'outline'
					);
				}
				return styles;
			}
		);

		const { result } = renderHook( () =>
			useStylesForBlocks( { clientId: 'test-id', onSwitch: jest.fn() } )
		);

		expect( result.current.stylesToRender ).toHaveLength( 1 );
		expect( result.current.stylesToRender[ 0 ].name ).toBe( 'default' );
	} );

	it( 'filters styles based on custom global states (e.g. dark mode)', () => {
		select.mockImplementationOnce( ( storeName ) => {
			if ( storeName === 'my-custom-plugin' ) {
				return { isDarkModeActive: () => true };
			}
			return {};
		} );

		addFilter(
			'blockEditor.useStylesForBlock',
			'test/filter-by-dark-mode',
			( styles ) => {
				const isDarkMode =
					select( 'my-custom-plugin' ).isDarkModeActive();
				if ( isDarkMode ) {
					return [
						...styles,
						{ name: 'dark-outline', label: 'Dark Outline' },
					];
				}
				return styles;
			}
		);

		const { result } = renderHook( () =>
			useStylesForBlocks( { clientId: 'test-id', onSwitch: jest.fn() } )
		);

		expect( result.current.stylesToRender ).toHaveLength( 3 );
		expect( result.current.stylesToRender[ 2 ].name ).toBe(
			'dark-outline'
		);
	} );
} );
