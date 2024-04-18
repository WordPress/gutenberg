/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DisableNonPageContentBlocks from '../disable-non-page-content-blocks';

describe( 'DisableNonPageContentBlocks', () => {
	it( 'disables page content blocks', () => {
		const testBlocks = {
			0: 'core/template-part',
			/**/ '00': 'core/site-title',
			/**/ '01': 'core/navigation',
			1: 'core/group',
			/**/ 10: 'core/post-title',
			/**/ 11: 'core/post-featured-image',
			/**/ 12: 'core/post-content',
			/**/ /**/ 120: 'core/paragraph',
			/**/ /**/ 121: 'core/post-featured-image',
			2: 'core/query',
			/**/ 20: 'core/post-title',
			/**/ 21: 'core/post-featured-image',
			/**/ 22: 'core/post-content',
			3: 'core/template-part',
			/**/ 30: 'core/paragraph',
		};

		const setBlockEditingMode = jest.fn( () => ( {
			type: 'SET_BLOCK_EDITING_MODE',
		} ) );
		const unsetBlockEditingMode = jest.fn( () => ( {
			type: 'UNSET_BLOCK_EDITING_MODE',
		} ) );

		const registry = createRegistry();

		registry.registerStore( 'core/block-editor', {
			reducer: () => {},
			selectors: {
				getBlocksByName( state, blockNames ) {
					return Object.keys( testBlocks ).filter( ( clientId ) =>
						blockNames.includes( testBlocks[ clientId ] )
					);
				},
				getBlockParents( state, clientId ) {
					return clientId.slice( 0, -1 ).split( '' );
				},
				getBlockName( state, clientId ) {
					return testBlocks[ clientId ];
				},
				getBlockOrder( state, rootClientId ) {
					return Object.keys( testBlocks ).filter(
						( clientId ) =>
							clientId.startsWith( rootClientId ) &&
							clientId !== rootClientId
					);
				},
			},
			actions: {
				setBlockEditingMode,
				unsetBlockEditingMode,
			},
		} );

		registry.registerStore( 'core', {
			reducer: () => {},
			selectors: {
				canUser() {
					return true;
				},
			},
			actions: {},
		} );

		const { unmount } = render(
			<RegistryProvider value={ registry }>
				<DisableNonPageContentBlocks />
			</RegistryProvider>
		);

		expect( setBlockEditingMode.mock.calls ).toEqual(
			expect.arrayContaining( [
				[ '', 'disabled' ], // root
				[ '0', 'contentOnly' ], // core/template-part
				[ '00', 'disabled' ], // core/site-title
				[ '01', 'disabled' ], // core/navigation
				[ '10', 'contentOnly' ], // post-title
				[ '11', 'contentOnly' ], // post-featured-image
				[ '12', 'contentOnly' ], // post-content
				[ '3', 'contentOnly' ], // core/template-part
				[ '30', 'disabled' ], // core/paragraph
				// NOT the post-featured-image nested within post-content
				// NOT any of the content blocks within query
			] )
		);

		unmount();

		expect( unsetBlockEditingMode.mock.calls ).toEqual(
			expect.arrayContaining( [
				[ '' ], // root
				[ '0' ], // core/template-part
				[ '00' ], // core/site-title
				[ '01' ], // core/navigation
				[ '10' ], // post-title
				[ '11' ], // post-featured-image
				[ '12' ], // post-content
				[ '3' ], // core/template-part
				[ '30' ], // core/paragraph
			] )
		);
	} );
} );
