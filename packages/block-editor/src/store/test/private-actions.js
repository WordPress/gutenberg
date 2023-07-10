/**
 * Internal dependencies
 */
import {
	hideBlockInterface,
	showBlockInterface,
	setBlockEditingMode,
	unsetBlockEditingMode,
	updateInsertUsage,
	__experimentalUpdateSettings,
} from '../private-actions';

describe( 'private actions', () => {
	describe( 'hideBlockInterface', () => {
		it( 'should return the HIDE_BLOCK_INTERFACE action', () => {
			expect( hideBlockInterface() ).toEqual( {
				type: 'HIDE_BLOCK_INTERFACE',
			} );
		} );
	} );

	describe( 'showBlockInterface', () => {
		it( 'should return the SHOW_BLOCK_INTERFACE action', () => {
			expect( showBlockInterface() ).toEqual( {
				type: 'SHOW_BLOCK_INTERFACE',
			} );
		} );
	} );

	describe( 'setBlockEditingMode', () => {
		it( 'should return the SET_BLOCK_EDITING_MODE action', () => {
			expect(
				setBlockEditingMode(
					'14501cc2-90a6-4f52-aa36-ab6e896135d1',
					'default'
				)
			).toEqual( {
				type: 'SET_BLOCK_EDITING_MODE',
				clientId: '14501cc2-90a6-4f52-aa36-ab6e896135d1',
				mode: 'default',
			} );
		} );
	} );

	describe( 'unsetBlockEditingMode', () => {
		it( 'should return the UNSET_BLOCK_EDITING_MODE action', () => {
			expect(
				unsetBlockEditingMode( '14501cc2-90a6-4f52-aa36-ab6e896135d1' )
			).toEqual( {
				type: 'UNSET_BLOCK_EDITING_MODE',
				clientId: '14501cc2-90a6-4f52-aa36-ab6e896135d1',
			} );
		} );
	} );

	describe( 'updateInsertUsage', () => {
		it( 'should record recently used blocks', () => {
			const setPreference = jest.fn();
			const registry = {
				dispatch: () => ( {
					set: setPreference,
					markNextChangeAsExpensive: () => {},
				} ),
				select: () => ( {
					get: () => {},
					getActiveBlockVariation: () => {},
				} ),
			};

			updateInsertUsage( [
				{
					clientId: 'bacon',
					name: 'core/embed',
				},
			] )( { registry } );

			expect( setPreference ).toHaveBeenCalledWith(
				'core',
				'insertUsage',
				{
					'core/embed': {
						time: expect.any( Number ),
						count: 1,
					},
				}
			);
		} );

		it( 'merges insert usage if more blocks are added of the same type', () => {
			const setPreference = jest.fn();
			const registry = {
				dispatch: () => ( {
					set: setPreference,
					markNextChangeAsExpensive: () => {},
				} ),
				select: () => ( {
					// simulate an existing embed block.
					get: () => ( {
						'core/embed': {
							time: 123456,
							count: 1,
						},
					} ),
					getActiveBlockVariation: () => {},
				} ),
			};

			updateInsertUsage( [
				{
					clientId: 'eggs',
					name: 'core/embed',
				},
				{
					clientId: 'bacon',
					name: 'core/block',
					attributes: { ref: 123 },
				},
			] )( { registry } );

			expect( setPreference ).toHaveBeenCalledWith(
				'core',
				'insertUsage',
				{
					// The reusable block has a special case where each ref is
					// stored as though an individual block, and the ref is
					// also recorded in the `insert` object.
					'core/block/123': {
						time: expect.any( Number ),
						count: 1,
					},
					'core/embed': {
						time: expect.any( Number ),
						count: 2,
					},
				}
			);
		} );

		describe( 'block variations handling', () => {
			const blockWithVariations = 'core/test-block-with-variations';

			it( 'should return proper results with both found or not found block variation matches', () => {
				const setPreference = jest.fn();
				const registry = {
					dispatch: () => ( {
						set: setPreference,
						markNextChangeAsExpensive: () => {},
					} ),
					select: () => ( {
						get: () => {},
						// simulate an active block variation:
						// - 'apple' when the fruit attribute is 'apple'.
						// - 'orange' when the fruit attribute is 'orange'.
						getActiveBlockVariation: (
							blockName,
							{ fruit } = {}
						) => {
							if ( blockName === blockWithVariations ) {
								if ( fruit === 'orange' )
									return { name: 'orange' };
								if ( fruit === 'apple' )
									return { name: 'apple' };
							}
						},
					} ),
				};

				updateInsertUsage( [
					{
						clientId: 'no match',
						name: blockWithVariations,
					},
					{
						clientId: 'not a variation match',
						name: blockWithVariations,
						attributes: { fruit: 'not in a variation' },
					},
					{
						clientId: 'orange',
						name: blockWithVariations,
						attributes: { fruit: 'orange' },
					},
					{
						clientId: 'apple',
						name: blockWithVariations,
						attributes: { fruit: 'apple' },
					},
				] )( { registry } );

				const orangeVariationName = `${ blockWithVariations }/orange`;
				const appleVariationName = `${ blockWithVariations }/apple`;

				expect( setPreference ).toHaveBeenCalledWith(
					'core',
					'insertUsage',
					{
						[ orangeVariationName ]: {
							time: expect.any( Number ),
							count: 1,
						},
						[ appleVariationName ]: {
							time: expect.any( Number ),
							count: 1,
						},
						[ blockWithVariations ]: {
							time: expect.any( Number ),
							count: 2,
						},
					}
				);
			} );
		} );
	} );

	describe( '__experimentalUpdateSettings', () => {
		const experimentalSettings = {
			inserterMediaCategories: 'foo',
			blockInspectorAnimation: 'bar',
		};

		const stableSettings = {
			foo: 'foo',
			bar: 'bar',
			baz: 'baz',
		};

		const settings = {
			...experimentalSettings,
			...stableSettings,
		};

		it( 'should dispatch provided settings by default', () => {
			expect( __experimentalUpdateSettings( settings ) ).toEqual( {
				type: 'UPDATE_SETTINGS',
				settings,
				reset: false,
			} );
		} );

		it( 'should dispatch provided settings with reset flag when `reset` argument is truthy', () => {
			expect(
				__experimentalUpdateSettings( settings, {
					stripExperimentalSettings: false,
					reset: true,
				} )
			).toEqual( {
				type: 'UPDATE_SETTINGS',
				settings,
				reset: true,
			} );
		} );

		it( 'should strip experimental settings from a given settings object when `stripExperimentalSettings` argument is truthy', () => {
			expect(
				__experimentalUpdateSettings( settings, {
					stripExperimentalSettings: true,
				} )
			).toEqual( {
				type: 'UPDATE_SETTINGS',
				settings: {
					foo: 'foo',
					bar: 'bar',
					baz: 'baz',
				},
				reset: false,
			} );
		} );
	} );
} );
