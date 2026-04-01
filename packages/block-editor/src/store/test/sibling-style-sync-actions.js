/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	__experimentalUpdateSyncedBlockAttributes,
	__experimentalRelinkBlockStyleSync,
} from '../private-actions';

// Make unlock() a passthrough so registry.select() returns the private
// selectors mock directly, without needing a real locked store.
jest.mock( '../../lock-unlock', () => ( {
	unlock: ( obj ) => obj,
	lock: jest.fn(),
} ) );

describe( 'sibling style sync actions', () => {
	let select, dispatch, registry, privateSelect;

	beforeAll( () => {
		registerBlockType( 'core/accordion', {
			apiVersion: 3,
			title: 'Accordion',
			category: 'design',
			edit: () => null,
			save: () => null,
			attributes: {},
		} );
		registerBlockType( 'core/accordion-heading', {
			apiVersion: 3,
			title: 'Accordion Heading',
			category: 'design',
			edit: () => null,
			save: () => null,
			attributes: {},
			supports: {
				__experimentalSiblingStyleSync: {
					scope: 'core/accordion',
				},
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/accordion' );
		unregisterBlockType( 'core/accordion-heading' );
	} );

	beforeEach( () => {
		// dispatch must be callable (for action objects) and have method props (for thunks).
		dispatch = Object.assign( jest.fn(), {
			updateBlockAttributes: jest.fn(),
		} );

		privateSelect = {
			__experimentalGetSiblingStyleSyncScopeClientId: jest
				.fn()
				.mockReturnValue( 'acc-1' ),
			__experimentalIsBlockStyleSyncUnlinked: jest
				.fn()
				.mockReturnValue( false ),
			__experimentalGetSiblingStyleSyncBlocks: jest
				.fn()
				.mockReturnValue( [] ),
		};

		select = {
			getBlockName: jest.fn().mockReturnValue( 'core/accordion-heading' ),
			getBlockAttributes: jest.fn().mockReturnValue( {} ),
		};

		registry = {
			// unlock is a no-op, so this object is used directly as privateSelect.
			select: jest.fn().mockReturnValue( privateSelect ),
			batch: jest.fn( ( fn ) => fn() ),
		};
	} );

	describe( '__experimentalUpdateSyncedBlockAttributes', () => {
		it( 'propagates synced attributes to all linked siblings', () => {
			privateSelect.__experimentalGetSiblingStyleSyncBlocks.mockReturnValue(
				[ { clientId: 'head-2' }, { clientId: 'head-3' } ]
			);

			__experimentalUpdateSyncedBlockAttributes( 'head-1', {
				textColor: 'vivid-red',
			} )( { select, dispatch, registry } );

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'head-1', 'head-2', 'head-3' ],
				{ textColor: 'vivid-red' }
			);
		} );

		it( 'does not propagate when the source block is unlinked', () => {
			privateSelect.__experimentalGetSiblingStyleSyncBlocks.mockReturnValue(
				[ { clientId: 'head-2' } ]
			);
			// Source block itself is unlinked.
			privateSelect.__experimentalIsBlockStyleSyncUnlinked.mockImplementation(
				( clientId ) => clientId === 'head-1'
			);

			__experimentalUpdateSyncedBlockAttributes( 'head-1', {
				textColor: 'vivid-red',
			} )( { select, dispatch, registry } );

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledTimes( 1 );
			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				'head-1',
				{ textColor: 'vivid-red' }
			);
		} );

		it( 'excludes unlinked siblings from propagation', () => {
			privateSelect.__experimentalGetSiblingStyleSyncBlocks.mockReturnValue(
				[ { clientId: 'head-2' }, { clientId: 'head-3' } ]
			);
			// head-3 is individually unlinked.
			privateSelect.__experimentalIsBlockStyleSyncUnlinked.mockImplementation(
				( clientId ) => clientId === 'head-3'
			);

			__experimentalUpdateSyncedBlockAttributes( 'head-1', {
				textColor: 'vivid-red',
			} )( { select, dispatch, registry } );

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				[ 'head-1', 'head-2' ],
				{ textColor: 'vivid-red' }
			);
		} );

		it( 'does not propagate when syncDescendantStyles is disabled for this block type', () => {
			select.getBlockAttributes.mockImplementation( ( clientId ) => {
				if ( clientId === 'acc-1' ) {
					return {
						syncDescendantStyles: {
							'core/accordion-heading': false,
						},
					};
				}
				return {};
			} );
			privateSelect.__experimentalGetSiblingStyleSyncBlocks.mockReturnValue(
				[ { clientId: 'head-2' } ]
			);

			__experimentalUpdateSyncedBlockAttributes( 'head-1', {
				textColor: 'vivid-red',
			} )( { select, dispatch, registry } );

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledTimes( 1 );
			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				'head-1',
				{ textColor: 'vivid-red' }
			);
		} );

		it( 'applies only unsynced attributes to the source block', () => {
			__experimentalUpdateSyncedBlockAttributes( 'head-1', {
				content: 'Hello',
			} )( { select, dispatch, registry } );

			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledTimes( 1 );
			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				'head-1',
				{ content: 'Hello' }
			);
		} );

		it( 'deep-merges the style attribute per sibling, preserving unsynced sub-keys', () => {
			privateSelect.__experimentalGetSiblingStyleSyncBlocks.mockReturnValue(
				[ { clientId: 'head-2' } ]
			);
			select.getBlockAttributes.mockImplementation( ( clientId ) => {
				if ( clientId === 'head-2' ) {
					// head-2 has existing spacing that should be preserved.
					return { style: { spacing: { padding: '1em' } } };
				}
				return {};
			} );

			__experimentalUpdateSyncedBlockAttributes( 'head-1', {
				style: { color: { text: '#f00' } },
			} )( { select, dispatch, registry } );

			// head-2 should get the new color merged with its existing spacing.
			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				'head-2',
				{
					style: {
						color: { text: '#f00' },
						spacing: { padding: '1em' },
					},
				}
			);
		} );
	} );

	describe( '__experimentalRelinkBlockStyleSync', () => {
		it( 'immediately copies canonical styles from the first linked sibling', () => {
			privateSelect.__experimentalGetSiblingStyleSyncBlocks.mockReturnValue(
				[ { clientId: 'head-2' } ]
			);
			select.getBlockAttributes.mockImplementation( ( clientId ) => {
				if ( clientId === 'head-2' ) {
					return { textColor: 'vivid-red' };
				}
				return {};
			} );

			__experimentalRelinkBlockStyleSync(
				'head-1',
				'core/accordion-heading',
				'acc-1'
			)( { select, dispatch, registry } );

			// Should dispatch the RELINK action and a single combined attribute
			// update all in one batch so it's a single undo entry.
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'RELINK_SIBLING_STYLE_SYNC',
				clientId: 'head-1',
				blockName: 'core/accordion-heading',
				scopeClientId: 'acc-1',
			} );
			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledTimes( 1 );
			expect( dispatch.updateBlockAttributes ).toHaveBeenCalledWith(
				'head-1',
				{ styleSyncUnlinked: false, textColor: 'vivid-red' }
			);
		} );
	} );
} );
