/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
// @ts-ignore - Preferences package is not typed.
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import type { MenuItem } from '../../store/types';
import type { WorkspaceConfig } from '../workspaces';

const PREFERENCE_SCOPE = 'wordpress/boot';
const PREFERENCE_KEY = 'sidebarNavigation';
const PREFERENCE_VERSION = 1;
const DEFAULT_SECTION_ID = 'default';
const ADVANCED_SECTION_ID = 'advanced';
const CUSTOM_SECTION_PREFIX = 'custom:';
const DEFAULT_SEPARATE_ROOT_SECTIONS = [ 'design', ADVANCED_SECTION_ID ];
const EMPTY_PROMOTED_ITEM_IDS: string[] = [];
export const ROOT_NAVIGATION_PARENT = '__root__';

export interface SidebarNavigationPreferenceSection {
	id: string;
	label?: string;
	itemIds: string[];
	isCustom?: boolean;
}

export interface SidebarNavigationPreference {
	version: typeof PREFERENCE_VERSION;
	sections: SidebarNavigationPreferenceSection[];
	hiddenItemIds: string[];
}

export interface SidebarNavigationSection
	extends SidebarNavigationPreferenceSection {
	label: string;
	items: MenuItem[];
	isPinned?: boolean;
	menuItem?: MenuItem;
}

export interface SidebarNavigationLayout {
	sections: SidebarNavigationSection[];
	rootItems: MenuItem[];
	pinnedRootItems: MenuItem[];
	getItemById: ( itemId: string | undefined ) => MenuItem | undefined;
	getItemsForParent: ( parentId: string | undefined ) => MenuItem[];
	getNavigationParentId: ( itemId: string | undefined ) => string | undefined;
	isItemVisible: ( itemId: string ) => boolean;
	setItemVisibility: ( itemId: string, isVisible: boolean ) => void;
	moveItem: (
		itemId: string,
		targetSectionId: string,
		targetIndex?: number
	) => void;
	moveSection: ( sectionId: string, targetSectionId: string ) => void;
	addSection: ( label: string ) => void;
	updateSectionLabel: ( sectionId: string, label: string ) => void;
	removeSection: ( sectionId: string ) => void;
	reset: () => void;
}

type SidebarNavigationLayoutOptions = Pick<
	WorkspaceConfig,
	'navigationPreferenceKey' | 'promotedNavigationItemIds'
>;

function isValidPreference(
	preference: unknown
): preference is SidebarNavigationPreference {
	return (
		!! preference &&
		typeof preference === 'object' &&
		( preference as SidebarNavigationPreference ).version ===
			PREFERENCE_VERSION &&
		Array.isArray(
			( preference as SidebarNavigationPreference ).sections
		) &&
		Array.isArray(
			( preference as SidebarNavigationPreference ).hiddenItemIds
		)
	);
}

function uniqueStrings( values: string[] ) {
	return Array.from( new Set( values.filter( Boolean ) ) );
}

function createCustomSectionId() {
	if ( window.crypto?.randomUUID ) {
		return `${ CUSTOM_SECTION_PREFIX }${ window.crypto.randomUUID() }`;
	}

	return `${ CUSTOM_SECTION_PREFIX }${ Date.now() }`;
}

function getEffectiveMenuItems(
	menuItems: MenuItem[],
	promotedRootItemIds: string[]
) {
	if ( promotedRootItemIds.length === 0 ) {
		return menuItems;
	}

	const promotedRootItemIdSet = new Set( promotedRootItemIds );

	return menuItems.map( ( item ) => {
		if ( ! promotedRootItemIdSet.has( item.id ) ) {
			return item;
		}

		return {
			...item,
			parent: undefined,
		};
	} );
}

function getDefaultSections(
	menuItems: MenuItem[],
	promotedRootItemIds: string[] = EMPTY_PROMOTED_ITEM_IDS
): SidebarNavigationPreferenceSection[] {
	const separateRootSections = new Set( DEFAULT_SEPARATE_ROOT_SECTIONS );
	const promotedRootItemIdSet = new Set( promotedRootItemIds );
	const rootItems = menuItems.filter( ( item ) => ! item.parent );
	const sectionParentIds = rootItems
		.filter(
			( item ) =>
				item.parent_type === 'drilldown' &&
				menuItems.some( ( candidate ) => candidate.parent === item.id )
		)
		.map( ( item ) => item.id );
	const baseRootItemIds = menuItems
		.filter(
			( item ) => ! item.parent && ! separateRootSections.has( item.id )
		)
		.map( ( item ) => item.id );
	const orderedPromotedRootItemIds = promotedRootItemIds.filter( ( itemId ) =>
		baseRootItemIds.includes( itemId )
	);
	const rootItemIds = uniqueStrings( [
		...baseRootItemIds.filter(
			( itemId ) => ! promotedRootItemIdSet.has( itemId )
		),
		...orderedPromotedRootItemIds,
	] );
	const sections: SidebarNavigationPreferenceSection[] = [
		{
			id: DEFAULT_SECTION_ID,
			itemIds: rootItemIds,
		},
	];

	for ( const sectionId of sectionParentIds ) {
		sections.push( {
			id: sectionId,
			itemIds: menuItems
				.filter(
					( item ) =>
						item.parent === sectionId &&
						! promotedRootItemIdSet.has( item.id )
				)
				.map( ( item ) => item.id ),
		} );
	}

	return sections;
}

function normalizePreference(
	menuItems: MenuItem[],
	preference: unknown,
	promotedRootItemIds: string[] = EMPTY_PROMOTED_ITEM_IDS
): SidebarNavigationPreference {
	const defaultSections = getDefaultSections(
		menuItems,
		promotedRootItemIds
	);
	const rawItemIds = new Set( menuItems.map( ( item ) => item.id ) );
	const defaultSectionIds = new Set(
		defaultSections.map( ( section ) => section.id )
	);
	const storedPreference = isValidPreference( preference )
		? preference
		: undefined;
	const storedSections = storedPreference?.sections ?? [];
	const storedItemSection = new Map< string, string >();

	for ( const section of storedSections ) {
		for ( const itemId of section.itemIds ) {
			if (
				rawItemIds.has( itemId ) &&
				! storedItemSection.has( itemId )
			) {
				storedItemSection.set( itemId, section.id );
			}
		}
	}

	const storedSectionById = new Map(
		storedSections.map( ( section ) => [ section.id, section ] )
	);
	const defaultSectionById = new Map(
		defaultSections.map( ( section ) => [ section.id, section ] )
	);
	const builtInSections: SidebarNavigationPreferenceSection[] =
		defaultSections.map( ( defaultSection ) => {
			const storedSection = storedSectionById.get( defaultSection.id );
			const storedItemIds = storedSection
				? uniqueStrings(
						storedSection.itemIds.filter( ( itemId ) =>
							rawItemIds.has( itemId )
						)
				  )
				: [];
			const newDefaultItemIds = defaultSection.itemIds.filter(
				( itemId ) => ! storedItemSection.has( itemId )
			);

			return {
				...defaultSection,
				itemIds: uniqueStrings( [
					...storedItemIds,
					...newDefaultItemIds,
				] ),
			};
		} );
	const customSections: SidebarNavigationPreferenceSection[] = storedSections
		.filter(
			( section ) =>
				section.isCustom ||
				( section.id.startsWith( CUSTOM_SECTION_PREFIX ) &&
					! defaultSectionIds.has( section.id ) )
		)
		.map( ( section ) => ( {
			id: section.id,
			label: section.label || __( 'Untitled section' ),
			isCustom: true,
			itemIds: uniqueStrings(
				section.itemIds.filter( ( itemId ) => rawItemIds.has( itemId ) )
			),
		} ) );
	const customSectionById = new Map(
		customSections.map( ( section ) => [ section.id, section ] )
	);
	const orderedNonDefaultIds = uniqueStrings( [
		...storedSections
			.map( ( section ) => section.id )
			.filter( ( id ) => id !== DEFAULT_SECTION_ID ),
		...defaultSections
			.map( ( section ) => section.id )
			.filter( ( id ) => id !== DEFAULT_SECTION_ID ),
	] );
	const orderedSections: SidebarNavigationPreferenceSection[] = [
		builtInSections[ 0 ],
		...orderedNonDefaultIds
			.map(
				( id ) =>
					customSectionById.get( id ) ?? defaultSectionById.get( id )
			)
			.filter(
				( section ): section is SidebarNavigationPreferenceSection =>
					!! section
			)
			.map( ( section ) => {
				if ( customSectionById.has( section.id ) ) {
					return customSectionById.get( section.id )!;
				}
				return builtInSections.find(
					( builtInSection ) => builtInSection.id === section.id
				)!;
			} ),
	];
	const usedItemIds = new Set< string >();
	const sections = orderedSections.map( ( section ) => {
		const itemIds = section.itemIds.filter( ( itemId ) => {
			if ( usedItemIds.has( itemId ) ) {
				return false;
			}
			usedItemIds.add( itemId );
			return true;
		} );

		return {
			...section,
			itemIds,
		};
	} );
	const sectionIds = new Set( sections.map( ( section ) => section.id ) );
	const hiddenItemIds = uniqueStrings(
		( storedPreference?.hiddenItemIds ?? [] ).filter(
			( itemId ) => rawItemIds.has( itemId ) || sectionIds.has( itemId )
		)
	);

	return {
		version: PREFERENCE_VERSION,
		sections,
		hiddenItemIds,
	};
}

function getSectionLabel(
	section: SidebarNavigationPreferenceSection,
	itemById: Map< string, MenuItem >
) {
	if ( section.id === DEFAULT_SECTION_ID ) {
		return __( 'Root' );
	}

	return section.label || itemById.get( section.id )?.label || section.id;
}

function createSectionMenuItem(
	section: SidebarNavigationPreferenceSection,
	itemById: Map< string, MenuItem >
): MenuItem {
	const existingItem = itemById.get( section.id );

	if ( existingItem ) {
		return existingItem;
	}

	return {
		id: section.id,
		label: getSectionLabel( section, itemById ),
		to: '#',
		parent_type: 'drilldown',
	};
}

function getItemAndAncestorIds(
	itemId: string,
	itemById: Map< string, MenuItem >
) {
	const ids: string[] = [];
	const visitedIds = new Set< string >();
	let currentId: string | undefined = itemId;

	while ( currentId && ! visitedIds.has( currentId ) ) {
		ids.push( currentId );
		visitedIds.add( currentId );
		currentId = itemById.get( currentId )?.parent;
	}

	return ids;
}

function getSectionNavigationParentId(
	section: SidebarNavigationSection,
	hiddenItemIds: Set< string >
) {
	if (
		section.id === DEFAULT_SECTION_ID ||
		hiddenItemIds.has( section.id )
	) {
		return ROOT_NAVIGATION_PARENT;
	}

	return section.id;
}

export function useSidebarNavigationLayout(
	menuItems: MenuItem[],
	options: SidebarNavigationLayoutOptions = {
		navigationPreferenceKey: PREFERENCE_KEY,
		promotedNavigationItemIds: EMPTY_PROMOTED_ITEM_IDS,
	}
): SidebarNavigationLayout {
	const navigationPreferenceKey =
		options.navigationPreferenceKey ?? PREFERENCE_KEY;
	const promotedNavigationItemIds =
		options.promotedNavigationItemIds ?? EMPTY_PROMOTED_ITEM_IDS;
	const effectiveMenuItems = useMemo(
		() => getEffectiveMenuItems( menuItems, promotedNavigationItemIds ),
		[ menuItems, promotedNavigationItemIds ]
	);
	const savedPreference = useSelect(
		( select ) =>
			select( preferencesStore ).get(
				PREFERENCE_SCOPE,
				navigationPreferenceKey
			),
		[ navigationPreferenceKey ]
	);
	const { set } = useDispatch( preferencesStore );
	const preference = useMemo(
		() =>
			normalizePreference(
				effectiveMenuItems,
				savedPreference,
				promotedNavigationItemIds
			),
		[ effectiveMenuItems, savedPreference, promotedNavigationItemIds ]
	);
	const itemById = useMemo(
		() =>
			new Map( effectiveMenuItems.map( ( item ) => [ item.id, item ] ) ),
		[ effectiveMenuItems ]
	);
	const hiddenItemIds = useMemo(
		() => new Set( preference.hiddenItemIds ),
		[ preference.hiddenItemIds ]
	);
	const updatePreference = useCallback(
		(
			updater: (
				currentPreference: SidebarNavigationPreference
			) => SidebarNavigationPreference
		) => {
			set(
				PREFERENCE_SCOPE,
				navigationPreferenceKey,
				normalizePreference(
					effectiveMenuItems,
					updater(
						normalizePreference(
							effectiveMenuItems,
							savedPreference,
							promotedNavigationItemIds
						)
					),
					promotedNavigationItemIds
				)
			);
		},
		[
			effectiveMenuItems,
			navigationPreferenceKey,
			promotedNavigationItemIds,
			savedPreference,
			set,
		]
	);
	const isItemVisible = useCallback(
		( itemId: string ) => ! hiddenItemIds.has( itemId ),
		[ hiddenItemIds ]
	);
	const sections = useMemo< SidebarNavigationSection[] >(
		() =>
			preference.sections.map( ( section ) => ( {
				...section,
				label: getSectionLabel( section, itemById ),
				items: section.itemIds
					.filter( ( itemId ) => ! hiddenItemIds.has( itemId ) )
					.map( ( itemId ) => itemById.get( itemId ) )
					.filter( ( item ): item is MenuItem => !! item ),
				isPinned: section.id === ADVANCED_SECTION_ID,
				menuItem: createSectionMenuItem( section, itemById ),
			} ) ),
		[ preference.sections, itemById, hiddenItemIds ]
	);
	const sectionById = useMemo(
		() => new Map( sections.map( ( section ) => [ section.id, section ] ) ),
		[ sections ]
	);
	const itemSectionById = useMemo( () => {
		const map = new Map< string, SidebarNavigationSection >();

		for ( const section of sections ) {
			for ( const itemId of section.itemIds ) {
				if ( ! map.has( itemId ) ) {
					map.set( itemId, section );
				}
			}
		}

		return map;
	}, [ sections ] );
	const visibleSections = useMemo(
		() =>
			sections.filter(
				( section ) =>
					section.id !== DEFAULT_SECTION_ID &&
					! hiddenItemIds.has( section.id ) &&
					section.items.length > 0
			),
		[ sections, hiddenItemIds ]
	);
	const rootItems = useMemo( () => {
		const defaultSection = sectionById.get( DEFAULT_SECTION_ID );
		const defaultItems = defaultSection?.items ?? [];
		const defaultItemIds = new Set( defaultSection?.itemIds ?? [] );
		const sectionItems = visibleSections
			.filter(
				( section ) =>
					! section.isPinned && ! defaultItemIds.has( section.id )
			)
			.map( ( section ) => section.menuItem )
			.filter( ( item ): item is MenuItem => !! item );

		return [ ...defaultItems, ...sectionItems ];
	}, [ sectionById, visibleSections ] );
	const pinnedRootItems = useMemo(
		() =>
			visibleSections
				.filter( ( section ) => section.isPinned )
				.map( ( section ) => section.menuItem )
				.filter( ( item ): item is MenuItem => !! item ),
		[ visibleSections ]
	);

	const getItemById = useCallback(
		( itemId: string | undefined ) => {
			if ( ! itemId ) {
				return undefined;
			}

			return (
				itemById.get( itemId ) ?? sectionById.get( itemId )?.menuItem
			);
		},
		[ itemById, sectionById ]
	);

	const getItemsForParent = useCallback(
		( parentId: string | undefined ) => {
			if ( ! parentId ) {
				return [ ...rootItems, ...pinnedRootItems ];
			}

			const section = sectionById.get( parentId );
			if ( section && section.id !== DEFAULT_SECTION_ID ) {
				return section.items;
			}

			return effectiveMenuItems.filter(
				( item ) =>
					item.parent === parentId && ! hiddenItemIds.has( item.id )
			);
		},
		[
			effectiveMenuItems,
			hiddenItemIds,
			pinnedRootItems,
			rootItems,
			sectionById,
		]
	);

	const getNavigationParentId = useCallback(
		( itemId: string | undefined ) => {
			if ( ! itemId ) {
				return undefined;
			}

			for ( const ancestorId of getItemAndAncestorIds(
				itemId,
				itemById
			) ) {
				// Some root drilldown items, such as Content and Advanced, are
				// also section IDs. Prefer opening their section over treating
				// them as ordinary root items when a matched route points at
				// that item or one of its descendants.
				const ancestorSection = sectionById.get( ancestorId );
				if (
					ancestorSection &&
					ancestorSection.id !== DEFAULT_SECTION_ID
				) {
					return getSectionNavigationParentId(
						ancestorSection,
						hiddenItemIds
					);
				}

				const section = itemSectionById.get( ancestorId );
				if ( section ) {
					return getSectionNavigationParentId(
						section,
						hiddenItemIds
					);
				}
			}

			return undefined;
		},
		[ itemById, itemSectionById, sectionById, hiddenItemIds ]
	);

	const setItemVisibility = useCallback(
		( itemId: string, isVisible: boolean ) => {
			updatePreference( ( currentPreference ) => ( {
				...currentPreference,
				hiddenItemIds: isVisible
					? currentPreference.hiddenItemIds.filter(
							( hiddenItemId ) => hiddenItemId !== itemId
					  )
					: uniqueStrings( [
							...currentPreference.hiddenItemIds,
							itemId,
					  ] ),
			} ) );
		},
		[ updatePreference ]
	);

	const moveItem = useCallback(
		( itemId: string, targetSectionId: string, targetIndex?: number ) => {
			updatePreference( ( currentPreference ) => ( {
				...currentPreference,
				sections: currentPreference.sections.map( ( section ) => {
					const itemIds = section.itemIds.filter(
						( candidateId ) => candidateId !== itemId
					);

					if ( section.id !== targetSectionId ) {
						return {
							...section,
							itemIds,
						};
					}

					const nextItemIds = [ ...itemIds ];
					const insertIndex =
						typeof targetIndex === 'number'
							? Math.max(
									0,
									Math.min( targetIndex, nextItemIds.length )
							  )
							: nextItemIds.length;
					nextItemIds.splice( insertIndex, 0, itemId );

					return {
						...section,
						itemIds: nextItemIds,
					};
				} ),
			} ) );
		},
		[ updatePreference ]
	);

	const moveSection = useCallback(
		( sectionId: string, targetSectionId: string ) => {
			if (
				sectionId === targetSectionId ||
				sectionId === DEFAULT_SECTION_ID ||
				sectionId === ADVANCED_SECTION_ID ||
				targetSectionId === DEFAULT_SECTION_ID ||
				targetSectionId === ADVANCED_SECTION_ID
			) {
				return;
			}

			updatePreference( ( currentPreference ) => {
				const currentSections = [ ...currentPreference.sections ];
				const fromIndex = currentSections.findIndex(
					( section ) => section.id === sectionId
				);
				const toIndex = currentSections.findIndex(
					( section ) => section.id === targetSectionId
				);

				if ( fromIndex === -1 || toIndex === -1 ) {
					return currentPreference;
				}

				const [ movedSection ] = currentSections.splice( fromIndex, 1 );
				const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
				currentSections.splice( insertIndex, 0, movedSection );

				return {
					...currentPreference,
					sections: currentSections,
				};
			} );
		},
		[ updatePreference ]
	);

	const addSection = useCallback(
		( label: string ) => {
			const trimmedLabel = label.trim();

			if ( ! trimmedLabel ) {
				return;
			}

			updatePreference( ( currentPreference ) => {
				const advancedIndex = currentPreference.sections.findIndex(
					( section ) => section.id === ADVANCED_SECTION_ID
				);
				const nextSections = [ ...currentPreference.sections ];
				const section: SidebarNavigationPreferenceSection = {
					id: createCustomSectionId(),
					label: trimmedLabel,
					itemIds: [],
					isCustom: true,
				};

				if ( advancedIndex === -1 ) {
					nextSections.push( section );
				} else {
					nextSections.splice( advancedIndex, 0, section );
				}

				return {
					...currentPreference,
					sections: nextSections,
				};
			} );
		},
		[ updatePreference ]
	);

	const updateSectionLabel = useCallback(
		( sectionId: string, label: string ) => {
			updatePreference( ( currentPreference ) => ( {
				...currentPreference,
				sections: currentPreference.sections.map( ( section ) =>
					section.id === sectionId && section.isCustom
						? {
								...section,
								label,
						  }
						: section
				),
			} ) );
		},
		[ updatePreference ]
	);

	const removeSection = useCallback(
		( sectionId: string ) => {
			updatePreference( ( currentPreference ) => {
				const removedSection = currentPreference.sections.find(
					( section ) => section.id === sectionId
				);

				if ( ! removedSection?.isCustom ) {
					return currentPreference;
				}

				return {
					...currentPreference,
					sections: currentPreference.sections
						.filter( ( section ) => section.id !== sectionId )
						.map( ( section ) =>
							section.id === DEFAULT_SECTION_ID
								? {
										...section,
										itemIds: [
											...section.itemIds,
											...removedSection.itemIds,
										],
								  }
								: section
						),
				};
			} );
		},
		[ updatePreference ]
	);

	const reset = useCallback( () => {
		set( PREFERENCE_SCOPE, navigationPreferenceKey, undefined );
	}, [ navigationPreferenceKey, set ] );

	return {
		sections,
		rootItems,
		pinnedRootItems,
		getItemById,
		getItemsForParent,
		getNavigationParentId,
		isItemVisible,
		setItemVisibility,
		moveItem,
		moveSection,
		addSection,
		updateSectionLabel,
		removeSection,
		reset,
	};
}
