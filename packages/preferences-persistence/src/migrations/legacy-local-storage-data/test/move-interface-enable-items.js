/**
 * Internal dependencies
 */
import moveInterfaceEnableItems from '../move-interface-enable-items';

describe( 'moveInterfaceEnableItems', () => {
	it( 'migrates enableItems to the preferences store', () => {
		const state = {
			'core/interface': {
				enableItems: {
					singleEnableItems: {
						complementaryArea: {
							'core/edit-post': 'edit-post/document',
							'core/edit-site': 'edit-site/global-styles',
						},
					},
					multipleEnableItems: {
						pinnedItems: {
							'core/edit-post': {
								'plugin-1': true,
							},
							'core/edit-site': {
								'plugin-2': true,
							},
						},
					},
				},
			},
		};

		const convertedState = moveInterfaceEnableItems( state );

		expect( convertedState ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/edit-post': {
						complementaryArea: 'edit-post/document',
						pinnedItems: {
							'plugin-1': true,
						},
					},
					'core/edit-site': {
						complementaryArea: 'edit-site/global-styles',
						pinnedItems: {
							'plugin-2': true,
						},
					},
				},
			},
			'core/interface': {
				enableItems: undefined,
			},
		} );
	} );

	it( 'merges pinnedItems and complementaryAreas with existing preferences store data', () => {
		const state = {
			'core/interface': {
				enableItems: {
					singleEnableItems: {
						complementaryArea: {
							'core/edit-post': 'edit-post/document',
							'core/edit-site': 'edit-site/global-styles',
						},
					},
					multipleEnableItems: {
						pinnedItems: {
							'core/edit-post': {
								'plugin-1': true,
							},
							'core/edit-site': {
								'plugin-2': true,
							},
						},
					},
				},
			},
			'core/preferences': {
				preferences: {
					'core/edit-post': {
						preferenceA: 1,
						preferenceB: 2,
					},
					'core/edit-site': {
						preferenceC: true,
					},
				},
			},
		};

		const convertedState = moveInterfaceEnableItems( state );

		expect( convertedState ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/edit-post': {
						preferenceA: 1,
						preferenceB: 2,
						complementaryArea: 'edit-post/document',
						pinnedItems: {
							'plugin-1': true,
						},
					},
					'core/edit-site': {
						preferenceC: true,
						complementaryArea: 'edit-site/global-styles',
						pinnedItems: {
							'plugin-2': true,
						},
					},
				},
			},
			'core/interface': {
				enableItems: undefined,
			},
		} );
	} );
} );
