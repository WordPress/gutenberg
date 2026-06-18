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
import { useDispatch } from '@wordpress/data';
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
	compareTemplatePartsByArea,
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

const LOCATION_AREA_OPTIONS = [
	{ value: 'header', label: __( 'Header' ) },
	{ value: 'footer', label: __( 'Footer' ) },
	{ value: 'sidebar', label: __( 'Side area' ) },
	{ value: 'other', label: __( 'Other' ) },
];

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

function getAreaValue( part: TemplatePartRecord ) {
	if (
		part.area === 'header' ||
		part.area === 'footer' ||
		part.area === 'sidebar'
	) {
		return part.area;
	}

	return 'other';
}

function getAreaLabel( area: string ) {
	return (
		LOCATION_AREA_OPTIONS.find( ( option ) => option.value === area )
			?.label ?? __( 'Other' )
	);
}

function getLocationCandidates(
	templateParts: TemplatePartRecord[],
	editedContentByPartId: Record< string, string | { raw?: string } >
) {
	return templateParts
		.reduce< LocationCandidate[] >( ( locations, part ) => {
			const editedContent = editedContentByPartId[ String( part.id ) ];

			if ( ! templatePartHasNavigationBlock( part, editedContent ) ) {
				return locations;
			}

			const area = getAreaValue( part );
			const title =
				getTemplatePartTitle( part ) || getLocationLabel( part );

			locations.push( {
				id: String( part.id ),
				part,
				location: title,
				area,
				areaLabel: getAreaLabel( area ),
				description:
					area === 'other'
						? __( 'Custom site area' )
						: sprintf(
								/* translators: %s: Site area type, for example Header or Footer. */
								__( '%s area of your site' ),
								getAreaLabel( area )
						  ),
				previewContent: getTemplatePartRawContent(
					part,
					editedContent
				),
			} );

			return locations;
		}, [] )
		.sort( ( firstLocation, secondLocation ) =>
			compareTemplatePartsByArea(
				firstLocation.part,
				secondLocation.part
			)
		);
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

const locationFields: Field< LocationCandidate >[] = [
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
		label: __( 'Area' ),
		elements: LOCATION_AREA_OPTIONS,
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
	const { editEntityRecord } = useDispatch( coreStore ) as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: string | number,
			record: Partial< TemplatePartRecord >
		) => void;
	};

	const candidates = useMemo(
		() => getLocationCandidates( templateParts, editedContentByPartId ),
		[ editedContentByPartId, templateParts ]
	);
	const initialSelectionSignature = initialSelectedLocationIds.join( ',' );

	useEffect( () => {
		setSelection( initialSelectedLocationIds );
	}, [ initialSelectedLocationIds, initialSelectionSignature ] );

	const { data: shownCandidates, paginationInfo } = useMemo(
		() => filterSortAndPaginate( candidates, view, locationFields ),
		[ candidates, view ]
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
	const [ selectedArea, setSelectedArea ] = useState< string | 'all' >(
		'all'
	);
	const [ locationModalMode, setLocationModalMode ] = useState<
		LocationModalMode | undefined
	>();

	const locations = useMemo(
		() => ( navigationId ? locationsMap[ navigationId ] ?? [] : [] ),
		[ locationsMap, navigationId ]
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
	}, [ locations, locations.length, locationsSignature, navigationId ] );

	const areaFilterOptions = useMemo( () => {
		const areaCounts = locations.reduce< Map< string, number > >(
			( counts, location ) => {
				const area = getAreaValue( location.part );
				counts.set( area, ( counts.get( area ) ?? 0 ) + 1 );
				return counts;
			},
			new Map()
		);

		return LOCATION_AREA_OPTIONS.filter( ( option ) =>
			areaCounts.has( option.value )
		).map( ( option ) => {
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
		} );
	}, [ locations ] );

	const visibleLocations =
		selectedArea === 'all'
			? locations
			: locations.filter(
					( location ) =>
						getAreaValue( location.part ) === selectedArea
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
