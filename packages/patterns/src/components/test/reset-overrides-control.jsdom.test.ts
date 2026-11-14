import { describe, expect, it } from 'vitest';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { DataRegistry } from '@wordpress/data';
import { getPatternOverridesProvider } from '../reset-overrides-control';

describe( 'getPatternOverridesProvider', () => {
	it( 'returns the closest provider and its mapped attribute', () => {
		const blockNames: Record< string, string > = {
			closest: 'test/closest',
			outer: 'test/outer',
		};
		const blockTypes: Record< string, object > = {
			'test/closest': {
				providesContext: { 'pattern/overrides': 'overrides' },
			},
			'test/outer': {
				providesContext: { 'pattern/overrides': 'content' },
			},
		};
		// Stubs only the selectors the helper reads; any other store is `blocks`.
		const select = ( ( store: unknown ) => {
			if ( store === blockEditorStore ) {
				return {
					getBlockName: ( clientId: string ) =>
						blockNames[ clientId ],
					getBlockParents: () => [ 'closest', 'outer' ],
				};
			}

			return {
				getBlockType: ( blockName: string ) => blockTypes[ blockName ],
			};
		} ) as unknown as DataRegistry[ 'select' ];

		expect( getPatternOverridesProvider( select, 'child' ) ).toEqual( {
			clientId: 'closest',
			attributeName: 'overrides',
		} );
	} );
} );
