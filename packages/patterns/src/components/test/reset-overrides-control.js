/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getPatternOverridesProvider } from '../reset-overrides-control';

describe( 'getPatternOverridesProvider', () => {
	it( 'returns the closest provider and its mapped attribute', () => {
		const blockNames = {
			closest: 'test/closest',
			outer: 'test/outer',
		};
		const blockTypes = {
			'test/closest': {
				providesContext: { 'pattern/overrides': 'overrides' },
			},
			'test/outer': {
				providesContext: { 'pattern/overrides': 'content' },
			},
		};
		const select = ( store ) => {
			if ( store === blockEditorStore ) {
				return {
					getBlockName: ( clientId ) => blockNames[ clientId ],
					getBlockParents: () => [ 'closest', 'outer' ],
				};
			}

			if ( store === blocksStore ) {
				return {
					getBlockType: ( blockName ) => blockTypes[ blockName ],
				};
			}
		};

		expect( getPatternOverridesProvider( select, 'child' ) ).toEqual( {
			clientId: 'closest',
			attributeName: 'overrides',
		} );
	} );
} );
