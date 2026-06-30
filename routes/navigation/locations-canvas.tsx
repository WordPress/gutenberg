/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
import {
	Button,
	DropdownMenu,
	MenuItem,
	Modal,
	Notice,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	DataViews,
	filterSortAndPaginate,
	type Action,
	type Field,
	type View,
} from '@wordpress/dataviews';
import { Preview } from '@wordpress/lazy-editor';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Icon,
	layout,
	moreVertical,
	navigation as navigationIcon,
} from '@wordpress/icons';
import { EmptyState, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import useNavigationLocations, {
	type NavigationLocation,
} from './use-navigation-locations';
import useNavigationTemplateParts from './use-navigation-template-parts';
import {
	assignNavigationMenuToFirstBlock,
	getLocationLabel,
	getTemplatePartTitle,
	getTemplatePartRawContent,
	removeNavigationMenuFromFirstBlock,
	templatePartHasNavigationBlock,
	type TemplatePartRecord,
} from './navigation-locations';

type LocationCandidate = {
	id: string;
	part: TemplatePartRecord;
	location: string;
	area: string;
	areaLabel: string;
	description: string;
	previewContent?: string;
};

type LocationModalMode = 'choose' | 'update';

const EMPTY_SELECTED_LOCATION_IDS: string[] = [];
const EMPTY_TEMPLATE_PART_AREAS: TemplatePartAreaDefinition[] = [];
const UNCATEGORIZED_TEMPLATE_PART_AREA = 'uncategorized';
const PREFERRED_TEMPLATE_PART_AREA_ORDER = [
	'header',
	'footer',
	'sidebar',
	'navigation-overlay',
	UNCATEGORIZED_TEMPLATE_PART_AREA,
];

type TemplatePartAreaDefinition = {
	area: string;
	label: string;
	description?: string;
	icon?: string;
};

type TemplatePartAreaRegistry = {
	areas: TemplatePartAreaDefinition[];
	areasBySlug: Map< string, TemplatePartAreaDefinition >;
};

type LocationAreaFilterOption = {
	value: string;
	label: string;
};

const DEFAULT_LOCATION_VIEW: View = {
	type: 'grid',
	search: '',
	filters: [],
	page: 1,
	perPage: 12,
	titleField: 'location',
	mediaField: 'preview',
	fields: [ 'area' ],
	layout: {
		badgeFields: [ 'area' ],
		previewSize: 260,
	},
};

function getFallbackTemplatePartAreas(): TemplatePartAreaDefinition[] {
	return [
		{ area: 'header', label: __( 'Header' ) },
		{ area: 'footer', label: __( 'Footer' ) },
		{ area: 'sidebar', label: __( 'Side area' ) },
		{ area: 'navigation-overlay', label: __( 'Navigation Overlay' ) },
		{ area: UNCATEGORIZED_TEMPLATE_PART_AREA, label: __( 'General' ) },
	];
}

function getTemplatePartAreaValue( part: TemplatePartRecord ) {
	return part.area || UNCATEGORIZED_TEMPLATE_PART_AREA;
}

function getKnownPluralAreaLabel( area: string ) {
	switch ( area ) {
		case 'header':
			return __( 'Headers' );
		case 'footer':
			return __( 'Footers' );
		case 'sidebar':
			return __( 'Side areas' );
		case 'navigation-overlay':
			return __( 'Navigation overlays' );
		case UNCATEGORIZED_TEMPLATE_PART_AREA:
			return __( 'General areas' );
	}
}

function getTitleFromSlug( slug: string ) {
	return slug
		.split( /[-_]/ )
		.filter( Boolean )
		.map( ( part ) => part.charAt( 0 ).toUpperCase() + part.slice( 1 ) )
		.join( ' ' );
}

function getAreaDefinition( area: string, registry: TemplatePartAreaRegistry ) {
	return registry.areasBySlug.get( area );
}

function getSingularAreaLabel(
	area: string,
	registry: TemplatePartAreaRegistry
) {
	return (
		getAreaDefinition( area, registry )?.label || getTitleFromSlug( area )
	);
}

function getPluralAreaLabel(
	area: string,
	registry: TemplatePartAreaRegistry
) {
	const knownLabel = getKnownPluralAreaLabel( area );

	if ( knownLabel ) {
		return knownLabel;
	}

	const label = getSingularAreaLabel( area, registry );

	// WordPress exposes singular template part area labels. For custom areas in
	// this prototype, keep the registered label intact and make the grouping
	// read as plural without changing the underlying area slug.
	if ( label.endsWith( 's' ) ) {
		return label;
	}

	/* translators: %s: Template part area label, for example Hero or Utility. */
	return sprintf( __( '%s areas' ), label );
}

function createTemplatePartAreaRegistry(
	registeredAreas: TemplatePartAreaDefinition[]
): TemplatePartAreaRegistry {
	const fallbackAreas = getFallbackTemplatePartAreas();
	const areasBySlug = new Map< string, TemplatePartAreaDefinition >();

	for ( const area of [ ...registeredAreas, ...fallbackAreas ] ) {
		if ( ! area.area || areasBySlug.has( area.area ) ) {
			continue;
		}

		areasBySlug.set( area.area, area );
	}

	const areas = Array.from( areasBySlug.values() ).sort( ( first, second ) =>
		compareAreaValues( first.area, second.area, { areasBySlug, areas: [] } )
	);

	return {
		areas,
		areasBySlug,
	};
}

function useTemplatePartAreaRegistry() {
	const registeredAreas = useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()
				?.default_template_part_areas ?? EMPTY_TEMPLATE_PART_AREAS,
		[]
	) as TemplatePartAreaDefinition[];

	return useMemo(
		() => createTemplatePartAreaRegistry( registeredAreas ),
		[ registeredAreas ]
	);
}

function getAreaOrder( area: string, registry: TemplatePartAreaRegistry ) {
	const preferredIndex = PREFERRED_TEMPLATE_PART_AREA_ORDER.indexOf( area );

	if ( preferredIndex !== -1 ) {
		return preferredIndex;
	}

	const registeredIndex = registry.areas.findIndex(
		( registeredArea ) => registeredArea.area === area
	);

	return registeredIndex === -1
		? PREFERRED_TEMPLATE_PART_AREA_ORDER.length + registry.areas.length
		: PREFERRED_TEMPLATE_PART_AREA_ORDER.length + registeredIndex;
}

function compareAreaValues(
	firstArea: string,
	secondArea: string,
	registry: TemplatePartAreaRegistry
) {
	const firstOrder = getAreaOrder( firstArea, registry );
	const secondOrder = getAreaOrder( secondArea, registry );

	if ( firstOrder !== secondOrder ) {
		return firstOrder - secondOrder;
	}

	return getPluralAreaLabel( firstArea, registry ).localeCompare(
		getPluralAreaLabel( secondArea, registry )
	);
}

function normalizeMatchValue( value: string | number | undefined ) {
	return String( value ?? '' )
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '' );
}

function getTemplatePartAreaMatchScore(
	part: TemplatePartRecord,
	registry: TemplatePartAreaRegistry
) {
	const area = getTemplatePartAreaValue( part );
	const normalizedArea = normalizeMatchValue( area );
	const normalizedAreaLabel = normalizeMatchValue(
		getSingularAreaLabel( area, registry )
	);
	const targets = [ normalizedArea, normalizedAreaLabel ].filter( Boolean );
	const candidates = [ getTemplatePartTitle( part ), part.slug, part.id ].map(
		normalizeMatchValue
	);

	let bestScore = 3;

	for ( const candidate of candidates ) {
		for ( const target of targets ) {
			if ( candidate === target ) {
				bestScore = Math.min( bestScore, 0 );
			} else if ( candidate.startsWith( target ) ) {
				bestScore = Math.min( bestScore, 1 );
			} else if ( candidate.includes( target ) ) {
				bestScore = Math.min( bestScore, 2 );
			}
		}
	}

	return bestScore;
}

function compareTemplatePartsByRegisteredArea(
	firstPart: TemplatePartRecord,
	secondPart: TemplatePartRecord,
	registry: TemplatePartAreaRegistry
) {
	const firstArea = getTemplatePartAreaValue( firstPart );
	const secondArea = getTemplatePartAreaValue( secondPart );
	const areaComparison = compareAreaValues( firstArea, secondArea, registry );

	if ( areaComparison !== 0 ) {
		return areaComparison;
	}

	const scoreComparison =
		getTemplatePartAreaMatchScore( firstPart, registry ) -
		getTemplatePartAreaMatchScore( secondPart, registry );

	if ( scoreComparison !== 0 ) {
		return scoreComparison;
	}

	return getLocationLabel( firstPart ).localeCompare(
		getLocationLabel( secondPart )
	);
}

function getAreaFilterOptions(
	areas: Iterable< string >,
	registry: TemplatePartAreaRegistry
): LocationAreaFilterOption[] {
	return Array.from( new Set( areas ) )
		.sort( ( firstArea, secondArea ) =>
			compareAreaValues( firstArea, secondArea, registry )
		)
		.map( ( area ) => ( {
			value: area,
			label: getPluralAreaLabel( area, registry ),
		} ) );
}

function getLocationCandidates(
	templateParts: TemplatePartRecord[],
	editedContentByPartId: Record< string, string | { raw?: string } >,
	areaRegistry: TemplatePartAreaRegistry
) {
	return templateParts
		.reduce< LocationCandidate[] >( ( locations, part ) => {
			const editedContent = editedContentByPartId[ String( part.id ) ];

			if ( ! templatePartHasNavigationBlock( part, editedContent ) ) {
				return locations;
			}

			const area = getTemplatePartAreaValue( part );
			const title =
				getTemplatePartTitle( part ) || getLocationLabel( part );

			locations.push( {
				id: String( part.id ),
				part,
				location: title,
				area,
				areaLabel: getPluralAreaLabel( area, areaRegistry ),
				description:
					area === UNCATEGORIZED_TEMPLATE_PART_AREA
						? __( 'General site area' )
						: sprintf(
								/* translators: %s: Site area type, for example Header or Footer. */
								__( '%s location on your site' ),
								getSingularAreaLabel( area, areaRegistry )
						  ),
				previewContent: getTemplatePartRawContent(
					part,
					editedContent
				),
			} );

			return locations;
		}, [] )
		.sort( ( firstLocation, secondLocation ) =>
			compareTemplatePartsByRegisteredArea(
				firstLocation.part,
				secondLocation.part,
				areaRegistry
			)
		);
}

function getLocationFields(
	areaFilterOptions: LocationAreaFilterOption[]
): Field< LocationCandidate >[] {
	return [
		{
			id: 'preview',
			type: 'media',
			label: __( 'Preview' ),
			enableHiding: false,
			enableSorting: false,
			enableGlobalSearch: false,
			filterBy: false,
			render: ( { item } ) => (
				<div className="routes-navigation-choose-location-modal__preview">
					<Preview
						content={ item.previewContent }
						description={ item.location }
					/>
				</div>
			),
		},
		{
			id: 'location',
			type: 'text',
			label: __( 'Location' ),
			enableHiding: false,
			enableSorting: false,
			enableGlobalSearch: true,
			getValue: ( { item } ) => item.location,
			render: ( { item } ) => <Text weight="600">{ item.location }</Text>,
		},
		{
			id: 'area',
			type: 'text',
			label: __( 'Location type' ),
			elements: areaFilterOptions,
			filterBy: {
				operators: [ 'isAny' ],
				isPrimary: true,
			},
			enableSorting: false,
			enableGlobalSearch: false,
			getValue: ( { item } ) => item.area,
			render: ( { item } ) => item.areaLabel,
		},
		{
			id: 'description',
			type: 'text',
			label: __( 'Details' ),
			filterBy: false,
			enableSorting: false,
			enableGlobalSearch: true,
			getValue: ( { item } ) => item.description,
		},
	];
}

function LocationPreviewCard( { location }: { location: NavigationLocation } ) {
	const navigate = useNavigate();
	const templatePartId = encodeURIComponent( String( location.part.id ) );

	return (
		<div className="routes-navigation-locations-canvas__card">
			<div className="routes-navigation-locations-canvas__card-header">
				<Stack direction="row" gap="sm" align="center">
					<Icon icon={ layout } size={ 20 } />
					<Text variant="body-sm" weight="600">
						{ location.label }
					</Text>
				</Stack>
				<Button
					variant="tertiary"
					size="compact"
					onClick={ () =>
						navigate( {
							to: `/types/wp_template_part/edit/${ templatePartId }`,
						} )
					}
				>
					{ __( 'Edit' ) }
				</Button>
			</div>
			<button
				className="routes-navigation-locations-canvas__preview-button"
				onClick={ () =>
					navigate( {
						to: `/types/wp_template_part/edit/${ templatePartId }`,
					} )
				}
			>
				<Preview
					content={
						typeof location.part.content === 'string'
							? location.part.content
							: location.part.content?.raw
					}
					blocks={ location.part.blocks as any[] | undefined }
					description={ location.label }
				/>
			</button>
		</div>
	);
}

function getLocationActionLabel( count: number, mode: LocationModalMode ) {
	if ( mode === 'update' ) {
		return __( 'Update locations' );
	}

	if ( count === 0 ) {
		return __( 'Add to locations' );
	}

	return count === 1
		? __( 'Add to location' )
		: sprintf(
				/* translators: %d: Number of selected locations. */
				__( 'Add to %d locations' ),
				count
		  );
}

function getLocationSelectionSummary( count: number, mode: LocationModalMode ) {
	if ( count ) {
		return sprintf(
			/* translators: %d: Number of selected locations. */
			_n( '%d location selected', '%d locations selected', count ),
			count
		);
	}

	if ( mode === 'update' ) {
		return __( 'No locations selected.' );
	}

	return __( 'Select one or more locations for this menu.' );
}

function ChooseLocationModal( {
	initialSelectedLocationIds = EMPTY_SELECTED_LOCATION_IDS,
	mode = 'choose',
	navigationId,
	onClose,
}: {
	initialSelectedLocationIds?: string[];
	mode?: LocationModalMode;
	navigationId: number;
	onClose: () => void;
} ) {
	const [ view, setView ] = useState< View >( DEFAULT_LOCATION_VIEW );
	const [ error, setError ] = useState< string >();
	const [ selection, setSelection ] = useState< string[] >(
		initialSelectedLocationIds
	);
	const { templateParts, editedContentByPartId, isResolving } =
		useNavigationTemplateParts();
	const areaRegistry = useTemplatePartAreaRegistry();
	const { editEntityRecord } = useDispatch( coreStore ) as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: string | number,
			record: Partial< TemplatePartRecord >
		) => void;
	};

	const candidates = useMemo(
		() =>
			getLocationCandidates(
				templateParts,
				editedContentByPartId,
				areaRegistry
			),
		[ areaRegistry, editedContentByPartId, templateParts ]
	);
	const areaFilterOptions = useMemo(
		() =>
			getAreaFilterOptions(
				candidates.map( ( candidate ) => candidate.area ),
				areaRegistry
			),
		[ areaRegistry, candidates ]
	);
	const locationFields = useMemo(
		() => getLocationFields( areaFilterOptions ),
		[ areaFilterOptions ]
	);
	const initialSelectionSignature = initialSelectedLocationIds.join( ',' );

	useEffect( () => {
		setSelection( initialSelectedLocationIds );
	}, [ initialSelectedLocationIds, initialSelectionSignature ] );

	const { data: shownCandidates, paginationInfo } = useMemo(
		() => filterSortAndPaginate( candidates, view, locationFields ),
		[ candidates, locationFields, view ]
	);
	const selectedCandidates = useMemo(
		() =>
			candidates.filter( ( candidate ) =>
				selection.includes( candidate.id )
			),
		[ candidates, selection ]
	);
	const toggleLocationSelection = useCallback(
		( item: LocationCandidate ) => {
			setError( undefined );
			setSelection( ( currentSelection ) =>
				currentSelection.includes( item.id )
					? currentSelection.filter(
							( selectedId ) => selectedId !== item.id
					  )
					: [ ...currentSelection, item.id ]
			);
		},
		[]
	);

	const handleApplyLocations = useCallback(
		( items: LocationCandidate[] ) => {
			if ( mode === 'choose' && ! items.length ) {
				setError(
					__(
						'Select at least one location before applying this menu.'
					)
				);
				return;
			}

			const failedLocations: string[] = [];
			const selectedIds = new Set( items.map( ( item ) => item.id ) );
			const candidatesById = new Map(
				candidates.map( ( candidate ) => [ candidate.id, candidate ] )
			);

			for ( const item of items ) {
				const content = assignNavigationMenuToFirstBlock(
					item.part,
					navigationId,
					editedContentByPartId[ item.id ]
				);

				if ( ! content ) {
					failedLocations.push( item.location );
					continue;
				}

				editEntityRecord(
					'postType',
					'wp_template_part',
					item.part.id,
					{ content }
				);
			}

			if ( mode === 'update' ) {
				for ( const locationId of initialSelectedLocationIds ) {
					if ( selectedIds.has( locationId ) ) {
						continue;
					}

					const item = candidatesById.get( locationId );

					if ( ! item ) {
						continue;
					}

					const content = removeNavigationMenuFromFirstBlock(
						item.part,
						navigationId,
						editedContentByPartId[ item.id ]
					);

					if ( ! content ) {
						failedLocations.push( item.location );
						continue;
					}

					editEntityRecord(
						'postType',
						'wp_template_part',
						item.part.id,
						{ content }
					);
				}
			}

			if ( failedLocations.length ) {
				setError(
					sprintf(
						/* translators: %s: Comma-separated list of locations that could not be updated. */
						__(
							'Could not update these locations because they no longer contain a menu area: %s'
						),
						failedLocations.join( ', ' )
					)
				);
				return;
			}

			onClose();
		},
		[
			candidates,
			editedContentByPartId,
			editEntityRecord,
			initialSelectedLocationIds,
			mode,
			navigationId,
			onClose,
		]
	);

	const actions = useMemo< Action< LocationCandidate >[] >(
		() => [
			{
				id: 'show-menu-in-locations',
				label: ( items ) =>
					items.length === 1
						? __( 'Add to location' )
						: sprintf(
								/* translators: %d: Number of selected locations. */
								__( 'Add to %d locations' ),
								items.length
						  ),
				isPrimary: true,
				supportsBulk: true,
				callback: handleApplyLocations,
			},
		],
		[ handleApplyLocations ]
	);

	return (
		<Modal
			title={
				mode === 'update'
					? __( 'Update locations' )
					: __( 'Choose location' )
			}
			onRequestClose={ onClose }
			className="routes-navigation-choose-location-modal"
		>
			<Stack
				direction="column"
				gap="md"
				className="routes-navigation-choose-location-modal__content"
			>
				<Text>
					{ __(
						'Choose where this navigation menu should be shown on your site.'
					) }
				</Text>
				{ error && (
					<Notice
						status="error"
						isDismissible
						onRemove={ () => setError( undefined ) }
					>
						{ error }
					</Notice>
				) }
				{ ! isResolving && candidates.length === 0 ? (
					<EmptyState.Root className="routes-navigation-choose-location-modal__empty-state">
						<EmptyState.Icon icon={ navigationIcon } />
						<EmptyState.Title>
							{ __( 'No menu locations found' ) }
						</EmptyState.Title>
						<EmptyState.Description>
							{ __(
								'Add a menu space to a header, footer, or other site area before choosing a location here.'
							) }
						</EmptyState.Description>
					</EmptyState.Root>
				) : (
					<DataViews
						data={ shownCandidates }
						fields={ locationFields }
						view={ view }
						onChangeView={ setView }
						actions={ actions }
						selection={ selection }
						onChangeSelection={ setSelection }
						onClickItem={ toggleLocationSelection }
						isLoading={ isResolving }
						paginationInfo={ paginationInfo }
						getItemId={ ( item ) => item.id }
						defaultLayouts={ {
							grid: {
								showMedia: true,
							},
						} }
					>
						<div className="routes-navigation-choose-location-modal__controls">
							<div className="routes-navigation-choose-location-modal__toolbar">
								<DataViews.FiltersToggle />
							</div>
							<DataViews.FiltersToggled className="routes-navigation-choose-location-modal__filters" />
						</div>
						<div className="routes-navigation-choose-location-modal__grid">
							<DataViews.Layout />
						</div>
					</DataViews>
				) }
				{ candidates.length > 0 && (
					<div className="routes-navigation-choose-location-modal__footer">
						<Text variant="muted">
							{ getLocationSelectionSummary(
								selectedCandidates.length,
								mode
							) }
						</Text>
						<Stack direction="row" gap="xs">
							<Button
								variant="tertiary"
								onClick={ onClose }
								__next40pxDefaultSize
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								variant="primary"
								disabled={
									mode === 'choose' &&
									selectedCandidates.length === 0
								}
								accessibleWhenDisabled
								onClick={ () =>
									handleApplyLocations( selectedCandidates )
								}
								__next40pxDefaultSize
							>
								{ getLocationActionLabel(
									selectedCandidates.length,
									mode
								) }
							</Button>
						</Stack>
					</div>
				) }
			</Stack>
		</Modal>
	);
}

export default function NavigationLocationsCanvas( {
	navigationId,
}: {
	navigationId?: number;
} ) {
	const { locationsMap, isResolving } = useNavigationLocations();
	const areaRegistry = useTemplatePartAreaRegistry();
	const [ selectedArea, setSelectedArea ] = useState< string | 'all' >(
		'all'
	);
	const [ locationModalMode, setLocationModalMode ] = useState<
		LocationModalMode | undefined
	>();

	const locations = useMemo(
		() =>
			[
				...( navigationId ? locationsMap[ navigationId ] ?? [] : [] ),
			].sort( ( firstLocation, secondLocation ) =>
				compareTemplatePartsByRegisteredArea(
					firstLocation.part,
					secondLocation.part,
					areaRegistry
				)
			),
		[ areaRegistry, locationsMap, navigationId ]
	);
	const locationsSignature = locations
		.map( ( location ) => location.id )
		.join( ',' );
	const selectedLocationIds = useMemo(
		() => locations.map( ( location ) => location.id ),
		[ locations ]
	);

	useEffect( () => {
		setSelectedArea( 'all' );
	}, [ areaRegistry, locations.length, locationsSignature, navigationId ] );

	const areaFilterOptions = useMemo( () => {
		const areaCounts = locations.reduce< Map< string, number > >(
			( counts, location ) => {
				const area = getTemplatePartAreaValue( location.part );
				counts.set( area, ( counts.get( area ) ?? 0 ) + 1 );
				return counts;
			},
			new Map()
		);

		return getAreaFilterOptions( areaCounts.keys(), areaRegistry ).map(
			( option ) => {
				const count = areaCounts.get( option.value ) ?? 0;

				return {
					value: option.value,
					label: sprintf(
						/* translators: 1: Location type, 2: Number of matching locations. */
						__( '%1$s (%2$d)' ),
						option.label,
						count
					),
				};
			}
		);
	}, [ areaRegistry, locations ] );

	const visibleLocations =
		selectedArea === 'all'
			? locations
			: locations.filter(
					( location ) =>
						getTemplatePartAreaValue( location.part ) ===
						selectedArea
			  );
	const showLocationFilter =
		locations.length > 1 && areaFilterOptions.length > 1;

	if ( isResolving ) {
		return (
			<div className="routes-navigation-locations-canvas is-centered">
				<Spinner />
			</div>
		);
	}

	if ( ! navigationId ) {
		return (
			<div className="routes-navigation-locations-canvas is-centered">
				<EmptyState.Root>
					<EmptyState.Icon icon={ navigationIcon } />
					<EmptyState.Title>
						{ __( 'No menu selected' ) }
					</EmptyState.Title>
				</EmptyState.Root>
			</div>
		);
	}

	if ( ! locations.length ) {
		return (
			<div className="routes-navigation-locations-canvas is-top-centered">
				<EmptyState.Root className="routes-navigation-locations-canvas__empty-state">
					<EmptyState.Icon icon={ navigationIcon } />
					<EmptyState.Title>
						{ __( 'This menu is not shown on your site yet' ) }
					</EmptyState.Title>
					<EmptyState.Description>
						{ __(
							'Choose where this menu should appear, such as your header or footer.'
						) }
					</EmptyState.Description>
					<EmptyState.Actions>
						<Button
							variant="primary"
							onClick={ () => setLocationModalMode( 'choose' ) }
							__next40pxDefaultSize
						>
							{ __( 'Choose location' ) }
						</Button>
					</EmptyState.Actions>
				</EmptyState.Root>
				{ locationModalMode && (
					<ChooseLocationModal
						mode={ locationModalMode }
						navigationId={ navigationId }
						onClose={ () => setLocationModalMode( undefined ) }
					/>
				) }
			</div>
		);
	}

	return (
		<div className="routes-navigation-locations-canvas">
			<div className="routes-navigation-locations-canvas__toolbar">
				<div className="routes-navigation-locations-canvas__toolbar-copy">
					<Text
						className="routes-navigation-locations-canvas__title"
						render={ <h2 /> }
						variant="heading-lg"
					>
						{ __( 'Menu locations' ) }
					</Text>
					<Text variant="muted">
						{ sprintf(
							/* translators: %d: Number of locations where this navigation menu is shown. */
							_n(
								'This menu is shown in %d location on your site.',
								'This menu is shown in %d locations on your site.',
								locations.length
							),
							locations.length
						) }
					</Text>
				</div>
				<div className="routes-navigation-locations-canvas__actions">
					{ showLocationFilter && (
						<div className="routes-navigation-locations-canvas__switcher">
							<SelectControl
								label={ __( 'Show' ) }
								hideLabelFromVision
								value={ selectedArea }
								options={ [
									{
										value: 'all',
										label: sprintf(
											/* translators: %d: Number of locations where this navigation menu is shown. */
											__( 'All locations (%d)' ),
											locations.length
										),
									},
									...areaFilterOptions,
								] }
								onChange={ ( value ) =>
									setSelectedArea( value || 'all' )
								}
								__next40pxDefaultSize
							/>
						</div>
					) }
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'Menu location options' ) }
						popoverProps={ { placement: 'bottom-end' } }
						toggleProps={ {
							variant: 'tertiary',
							__next40pxDefaultSize: true,
						} }
					>
						{ ( { onClose } ) => (
							<MenuItem
								onClick={ () => {
									setLocationModalMode( 'update' );
									onClose();
								} }
							>
								{ __( 'Update locations' ) }
							</MenuItem>
						) }
					</DropdownMenu>
				</div>
			</div>
			<div className="routes-navigation-locations-canvas__previews">
				{ visibleLocations.map( ( location ) => (
					<LocationPreviewCard
						key={ location.id }
						location={ location }
					/>
				) ) }
			</div>
			{ locationModalMode && (
				<ChooseLocationModal
					initialSelectedLocationIds={
						locationModalMode === 'update'
							? selectedLocationIds
							: []
					}
					mode={ locationModalMode }
					navigationId={ navigationId }
					onClose={ () => setLocationModalMode( undefined ) }
				/>
			) }
		</div>
	);
}
