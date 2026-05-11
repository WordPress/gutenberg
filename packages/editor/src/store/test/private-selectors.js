/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import {
	getDefaultRenderingMode,
	getPostBlocksByName,
} from '../private-selectors';

describe( 'getPostBlocksByName', () => {
	const state = {
		blocks: {
			byClientId: new Map( [
				[ 'block1', { name: 'core/paragraph' } ],
				[ 'block2', { name: 'core/heading' } ],
				[ 'block3', { name: 'core/paragraph' } ],
				[ 'block4', { name: 'core/query' } ],
				[ 'block5', { name: 'core/paragraph' } ],
				[ 'block6', { name: 'core/heading' } ],
			] ),
			order: new Map( [
				[ '', [ 'block1', 'block2', 'block3', 'block4' ] ],
				[ 'block4', [ 'block5', 'block6' ] ],
			] ),
			parents: new Map( [
				[ 'block1', '' ],
				[ 'block2', '' ],
				[ 'block3', '' ],
				[ 'block4', '' ],
				[ 'block5', 'block4' ],
				[ 'block6', 'block4' ],
			] ),
		},
	};

	getPostBlocksByName.registry = {
		select: () => ( {
			getBlocksByName: ( blockNames ) =>
				Array.from( state.blocks.byClientId.keys() ).filter(
					( clientId ) =>
						blockNames.includes(
							state.blocks.byClientId.get( clientId ).name
						)
				),
			getBlockParents: ( clientId ) => {
				const parents = [];
				let parent = state.blocks.parents.get( clientId );
				while ( parent ) {
					parents.push( parent );
					parent = state.blocks.parents.get( parent );
				}
				return parents;
			},
			getBlockName: ( clientId ) =>
				state.blocks.byClientId.get( clientId ).name,
			getBlocks: () => [],
		} ),
	};

	it( 'should return top-level blocks of the specified name', () => {
		const result = getPostBlocksByName( state, 'core/paragraph' );
		expect( result ).toEqual( [ 'block1', 'block3' ] );
	} );

	it( 'should return an empty array if no blocks match', () => {
		const result = getPostBlocksByName( state, 'core/non-existent' );
		expect( result ).toEqual( [] );
	} );

	it( 'should ignore blocks inside a query block', () => {
		const result = getPostBlocksByName( state, 'core/paragraph' );
		expect( result ).toEqual( [ 'block1', 'block3' ] );
	} );

	it( 'should handle multiple block names', () => {
		const result = getPostBlocksByName( state, [
			'core/paragraph',
			'core/heading',
		] );
		expect( result ).toEqual( [ 'block1', 'block2', 'block3' ] );
	} );
} );

describe( 'getDefaultRenderingMode', () => {
	function setupRegistry( {
		supportsEditor = true,
		theme = 'twentytwentyfive',
		renderingModes = null,
	} = {} ) {
		getDefaultRenderingMode.registry = {
			select: ( store ) => {
				if ( store === coreStore ) {
					return {
						getPostType: () => ( {
							supports: { editor: supportsEditor },
						} ),
						getCurrentTheme: () => ( { stylesheet: theme } ),
						hasFinishedResolution: () => true,
					};
				}
				if ( store === preferencesStore ) {
					return {
						get: () => renderingModes,
					};
				}
			},
		};
	}

	describe( 'editor.default-mode post type support', () => {
		it( 'default-mode from post type support should be respected when no user preference is saved', () => {
			setupRegistry( {
				supportsEditor: [ { 'default-mode': 'template-locked' } ],
			} );
			const state = {
				editorSettings: { defaultRenderingMode: 'post-only' },
			};

			expect( getDefaultRenderingMode( state, 'post' ) ).toBe(
				'template-locked'
			);
		} );

		it( 'user preference should take priority over post type supports registered default-mode support', () => {
			setupRegistry( {
				theme: 'twentytwentyfive',
				supportsEditor: [ { 'default-mode': 'template-locked' } ],
				renderingModes: { twentytwentyfive: { post: 'post-only' } },
			} );
			const state = {
				editorSettings: { defaultRenderingMode: 'post-only' },
			};

			expect( getDefaultRenderingMode( state, 'post' ) ).toBe(
				'post-only'
			);
		} );
	} );

	describe( 'defaultRenderingMode from editor settings', () => {
		it( 'uses defaultRenderingMode from editor settings when no user preference is saved', () => {
			setupRegistry( { renderingModes: null } );
			const state = {
				editorSettings: { defaultRenderingMode: 'template-locked' },
			};

			expect( getDefaultRenderingMode( state, 'post' ) ).toBe(
				'template-locked'
			);
		} );

		it( 'user preference takes priority over defaultRenderingMode from editor settings', () => {
			setupRegistry( {
				theme: 'twentytwentyfive',
				renderingModes: {
					twentytwentyfive: { post: 'template-locked' },
				},
			} );
			const state = {
				editorSettings: { defaultRenderingMode: 'post-only' },
			};

			expect( getDefaultRenderingMode( state, 'post' ) ).toBe(
				'template-locked'
			);
		} );

		it( 'falls back to post-only when defaultRenderingMode in settings is the default', () => {
			setupRegistry( { renderingModes: null } );
			const state = {
				editorSettings: { defaultRenderingMode: 'post-only' },
			};

			expect( getDefaultRenderingMode( state, 'post' ) ).toBe(
				'post-only'
			);
		} );
	} );
} );
