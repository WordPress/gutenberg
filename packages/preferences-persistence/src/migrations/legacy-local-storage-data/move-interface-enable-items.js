/**
 * Migrates interface 'enableItems' data to the preferences store.
 *
 * The interface package stores this data in this format:
 * ```js
 * {
 *     enableItems: {
 *         singleEnableItems: {
 * 	           complementaryArea: {
 *                 'core/edit-post': 'edit-post/document',
 *                 'core/edit-site': 'edit-site/global-styles',
 *             }
 *         },
 *         multipleEnableItems: {
 *             pinnedItems: {
 *                 'core/edit-post': {
 *                     'plugin-1': true,
 *                 },
 *                 'core/edit-site': {
 *                     'plugin-2': true,
 *                 },
 *             },
 *         }
 *     }
 * }
 * ```
 *
 * and it should be converted it to:
 * ```js
 * {
 *     'core/edit-post': {
 *         complementaryArea: 'edit-post/document',
 *         pinnedItems: {
 *             'plugin-1': true,
 *         },
 *     },
 *     'core/edit-site': {
 *         complementaryArea: 'edit-site/global-styles',
 *         pinnedItems: {
 *             'plugin-2': true,
 *         },
 *     },
 * }
 * ```
 *
 * @param {Object} state The local storage state.
 */
export default function moveInterfaceEnableItems( state ) {
	const interfaceStoreName = 'core/interface';
	const preferencesStoreName = 'core/preferences';
	const sourceEnableItems = state?.[ interfaceStoreName ]?.enableItems;

	// There's nothing to migrate, exit early.
	if ( ! sourceEnableItems ) {
		return state;
	}

	const allPreferences = state?.[ preferencesStoreName ]?.preferences ?? {};

	// First convert complementaryAreas into the right format.
	// Use the existing preferences as the accumulator so that the data is
	// merged.
	const sourceComplementaryAreas =
		sourceEnableItems?.singleEnableItems?.complementaryArea ?? {};

	const preferencesWithConvertedComplementaryAreas = Object.keys(
		sourceComplementaryAreas
	).reduce( ( accumulator, scope ) => {
		const data = sourceComplementaryAreas[ scope ];

		// Don't overwrite any existing data in the preferences store.
		if ( accumulator?.[ scope ]?.complementaryArea ) {
			return accumulator;
		}

		return {
			...accumulator,
			[ scope ]: {
				...accumulator[ scope ],
				complementaryArea: data,
			},
		};
	}, allPreferences );

	// Next feed the converted complementary areas back into a reducer that
	// converts the pinned items, resulting in the fully migrated data.
	const sourcePinnedItems =
		sourceEnableItems?.multipleEnableItems?.pinnedItems ?? {};
	const allConvertedData = Object.keys( sourcePinnedItems ).reduce(
		( accumulator, scope ) => {
			const data = sourcePinnedItems[ scope ];
			// Don't overwrite any existing data in the preferences store.
			if ( accumulator?.[ scope ]?.pinnedItems ) {
				return accumulator;
			}

			return {
				...accumulator,
				[ scope ]: {
					...accumulator[ scope ],
					pinnedItems: data,
				},
			};
		},
		preferencesWithConvertedComplementaryAreas
	);

	const otherInterfaceItems = state[ interfaceStoreName ];

	return {
		...state,
		[ preferencesStoreName ]: {
			preferences: allConvertedData,
		},
		[ interfaceStoreName ]: {
			...otherInterfaceItems,
			enableItems: undefined,
		},
	};
}
