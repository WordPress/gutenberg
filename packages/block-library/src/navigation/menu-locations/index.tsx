import { BlockPreview } from '@wordpress/block-editor';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import type { Block } from '@wordpress/blocks';
import type { CSSProperties, ReactElement } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import {
	Badge,
	Card,
	EmptyState,
	Notice,
	Spinner,
	Stack,
	Text,
} from '@wordpress/ui';
import {
	navigation as navigationIcon,
	header as headerIcon,
	footer as footerIcon,
	mobile as mobileIcon,
} from '@wordpress/icons';
import { inertValue } from '@wordpress/react-inert-value';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';
import { useMenuLocations } from './use-menu-locations';
import ChooseLocationModal from './choose-location-modal';
import MenuSitePreview from './site-preview';
import {
	AREA_FILTERS,
	getAreaLabel,
	getFallbackMenuId,
	getMenuTitle,
	getPreviewBlocks,
	getRemovalOutcome,
	getTemplatePartBlocks,
	setNavigationMenu,
	showsMenu,
	TEMPLATE_PART_POST_TYPE,
} from './utils';
import type {
	MenuLocationBlock,
	NavigationLocation,
	NavigationMenuRecord,
	TemplatePartRecord,
} from './utils';
import withMenuName from './with-menu-name';

export { useMenuLocations, useNavigationLocations } from './use-menu-locations';
export { getWhereUsedLabel } from './utils';
export { default as MenuWhereUsed } from './menu-where-used';

const VIEW_PREVIEW = 'preview';
const VIEW_LOCATIONS = 'locations';

/*
 * Inline, as the panel also shows on screens that don't load the block
 * library's editor styles, such as the extensible site editor.
 */
const WEAK_COLOR = 'var(--wpds-color-foreground-content-neutral-weak, #757575)';
const STYLES = {
	root: {
		boxSizing: 'border-box',
		height: '100%',
		display: 'flex',
		flexDirection: 'column',
		background: 'var(--wpds-color-background-surface-neutral, #fff)',
		color: 'var(--wpds-color-foreground-content-neutral, #1e1e1e)',
	},
	toolbar: {
		padding: '12px 24px',
		borderBottom:
			'1px solid var(--wpds-color-stroke-surface-neutral, #e0e0e0)',
		flexShrink: 0,
	},
	body: {
		flex: 1,
		minHeight: 0,
		overflowY: 'auto',
		padding: 24,
		display: 'flex',
		flexDirection: 'column',
		gap: 16,
	},
	centered: {
		flex: 1,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	weak: { margin: 0, color: WEAK_COLOR },
	toolbarTitle: { flex: '1 1 120px', minWidth: 0, textAlign: 'center' },
	ellipsis: {
		maxWidth: '100%',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	list: { display: 'flex', flexDirection: 'column', gap: 24 },
	preview: {
		borderRadius: 2,
		overflow: 'hidden',
		outline: '1px solid var(--wpds-color-stroke-surface-neutral, #ddd)',
	},
} satisfies Record< string, CSSProperties >;

type RemovalOutcome = NonNullable< ReturnType< typeof getRemovalOutcome > >;
type EditLocation = ( part: TemplatePartRecord ) => void;

function getAreaIcon( area: string ) {
	switch ( area ) {
		case 'header':
			return headerIcon;
		case 'footer':
			return footerIcon;
		case NAVIGATION_OVERLAY_TEMPLATE_PART_AREA:
			return mobileIcon;
		default:
			return navigationIcon;
	}
}

function getLocationsSummary( count: number ) {
	if ( ! count ) {
		return __( 'Not shown on your site' );
	}
	return sprintf(
		/* translators: %d: Number of places where this menu is shown. */
		_n( 'Shown in %d location', 'Shown in %d locations', count ),
		count
	);
}

/**
 * Edits a template part's blocks the way the editor does, so the change goes
 * through the usual save flow.
 *
 * @return Called with a location and its new blocks.
 */
function useEditLocationBlocks() {
	const { editEntityRecord } = useDispatch( coreStore );

	return ( location: NavigationLocation, blocks: MenuLocationBlock[] ) =>
		editEntityRecord( 'postType', TEMPLATE_PART_POST_TYPE, location.id, {
			blocks,
			content: ( {
				blocks: blocksForSerialization = [],
			}: {
				blocks?: Block[];
			} ) => __unstableSerializeAndClean( blocksForSerialization ),
		} );
}

/**
 * The blocks of a location once a menu is taken out of it.
 *
 * @param location     The location.
 * @param navigationId The menu.
 * @param outcome      From `getRemovalOutcome`.
 * @param fallbackId   The menu shown when no menu is chosen.
 * @return The blocks.
 */
function getBlocksWithoutMenu(
	location: NavigationLocation,
	navigationId: number,
	outcome: RemovalOutcome,
	fallbackId: number | null
) {
	return setNavigationMenu(
		getTemplatePartBlocks( location.part ),
		( block ) => showsMenu( block, navigationId, fallbackId ),
		outcome.newMenuId
	);
}

function getRemovalDescription(
	locationTitle: string,
	outcome: RemovalOutcome
) {
	const shownTitle = getMenuTitle( outcome.shownMenu );

	return withMenuName(
		outcome.isFallback
			? sprintf(
					/* translators: %s: Where the menu is shown, like "Footer". "<menu />" is replaced by the name of another menu. */
					__(
						'%s will have no menu chosen, so it will show your newest menu, <menu />, instead.'
					),
					locationTitle
				)
			: sprintf(
					/* translators: %s: Where the menu is shown, like "Footer". "<menu />" is replaced by the name of another menu. */
					__( '%s will show <menu /> instead.' ),
					locationTitle
				),
		shownTitle
	);
}

function RemoveAction( {
	location,
	navigationId,
	menuTitle,
	menus,
}: {
	location: NavigationLocation;
	navigationId: number;
	menuTitle: string;
	menus: NavigationMenuRecord[];
} ) {
	const [ isConfirming, setIsConfirming ] = useState( false );
	const registry = useRegistry();
	const editLocationBlocks = useEditLocationBlocks();
	const { createSuccessNotice } = useDispatch( noticesStore );
	const outcome = getRemovalOutcome( menus, navigationId );
	const fallbackId = getFallbackMenuId( menus );

	const remove = () => {
		setIsConfirming( false );
		// Read now, not from render, so Undo puts back what was there.
		const previousBlocks = getTemplatePartBlocks(
			registry
				.select( coreStore )
				.getEditedEntityRecord(
					'postType',
					TEMPLATE_PART_POST_TYPE,
					location.id
				) as TemplatePartRecord
		);
		editLocationBlocks(
			location,
			getBlocksWithoutMenu( location, navigationId, outcome!, fallbackId )
		);
		createSuccessNotice(
			sprintf(
				/* translators: 1: Menu name. 2: Where it was shown, like "Footer". */
				__( 'Removed “%1$s” from %2$s. Save to apply.' ),
				menuTitle,
				location.title
			),
			{
				type: 'snackbar',
				actions: [
					{
						label: __( 'Undo' ),
						onClick: () =>
							editLocationBlocks( location, previousBlocks ),
					},
				],
			}
		);
	};

	return (
		<>
			<Button
				variant="tertiary"
				size="compact"
				onClick={ () => setIsConfirming( true ) }
				disabled={ ! outcome }
				accessibleWhenDisabled
				label={ sprintf(
					/* translators: %s: Name of a header, footer or overlay. */
					__( 'Remove from %s' ),
					location.title
				) }
				showTooltip={ false }
				description={
					outcome
						? undefined
						: __(
								'Publish another menu first. A place with no menu chosen shows your newest menu.'
							)
				}
			>
				{ __( 'Remove' ) }
			</Button>
			{ outcome && (
				<ConfirmDialog
					isOpen={ isConfirming }
					title={ sprintf(
						/* translators: 1: Menu name. 2: Where it's shown, like "Footer". */
						__( 'Remove “%1$s” from %2$s?' ),
						menuTitle,
						location.title
					) }
					__experimentalHideHeader={ false }
					onConfirm={ remove }
					onCancel={ () => setIsConfirming( false ) }
					confirmButtonText={ __( 'Remove' ) }
					size="medium"
				>
					<Text render={ <p /> } style={ { margin: 0 } }>
						{ getRemovalDescription( location.title, outcome ) }
					</Text>
				</ConfirmDialog>
			) }
		</>
	);
}

function LocationCard( {
	location,
	navigationId,
	menuTitle,
	menus,
	onEditLocation,
}: {
	location: NavigationLocation;
	navigationId: number;
	menuTitle: string;
	menus: NavigationMenuRecord[];
	onEditLocation?: EditLocation;
} ) {
	const blocks = useMemo( () => getPreviewBlocks( location ), [ location ] );

	return (
		<Card.Root className="menu-locations__card">
			<Card.Header>
				<Stack direction="row" align="center" justify="space-between">
					<Stack direction="row" align="center" gap="sm">
						<Card.Title>{ location.title }</Card.Title>
						<Badge>{ getAreaLabel( location.area ) }</Badge>
					</Stack>
					<Stack direction="row" align="center" gap="xs">
						<RemoveAction
							location={ location }
							navigationId={ navigationId }
							menuTitle={ menuTitle }
							menus={ menus }
						/>
						{ onEditLocation && (
							<Button
								variant="secondary"
								size="compact"
								onClick={ () =>
									onEditLocation( location.part )
								}
								label={ sprintf(
									/* translators: %s: Name of a header, footer or overlay. */
									__( 'Edit %s' ),
									location.title
								) }
								showTooltip={ false }
							>
								{ __( 'Edit' ) }
							</Button>
						) }
					</Stack>
				</Stack>
			</Card.Header>
			<Card.Content>
				{ location.usesFallback && (
					<Text
						render={ <p /> }
						variant="body-sm"
						style={ { ...STYLES.weak, marginBottom: 8 } }
					>
						{ __(
							'No menu was chosen here, so your newest menu shows.'
						) }
					</Text>
				) }
				<div style={ STYLES.preview } inert={ inertValue( true ) }>
					<BlockPreview.Async>
						<BlockPreview
							blocks={ blocks }
							viewportWidth={ 1200 }
						/>
					</BlockPreview.Async>
				</div>
			</Card.Content>
		</Card.Root>
	);
}

const FILTER_EMPTY_STATES: Record<
	string,
	() => { title: string; description: string }
> = {
	header: () => ( {
		title: __( 'Not in any headers' ),
		description: __( 'This menu isn’t shown in a header.' ),
	} ),
	footer: () => ( {
		title: __( 'Not in any footers' ),
		description: __( 'This menu isn’t shown in a footer.' ),
	} ),
	[ NAVIGATION_OVERLAY_TEMPLATE_PART_AREA ]: () => ( {
		title: __( 'Not in any overlays' ),
		description: __(
			'An overlay is the menu that opens from a menu button, usually on phones and other small screens. This menu isn’t shown in one.'
		),
	} ),
};

function LocationsView( {
	locations,
	navigationId,
	menuTitle,
	menus,
	onEditLocation,
	onChooseLocation,
}: {
	locations: NavigationLocation[];
	navigationId: number;
	menuTitle: string;
	menus: NavigationMenuRecord[];
	onEditLocation?: EditLocation;
	onChooseLocation: () => void;
} ) {
	const [ filter, setFilter ] = useState< string >( AREA_FILTERS.all );

	if ( ! locations.length ) {
		return (
			<div style={ STYLES.centered }>
				<EmptyState.Root>
					<EmptyState.Icon icon={ navigationIcon } />
					<EmptyState.Title>
						{ __( 'This menu isn’t shown anywhere yet' ) }
					</EmptyState.Title>
					<EmptyState.Description>
						{ __(
							'Visitors won’t see it until you add it to a header, footer or overlay.'
						) }
					</EmptyState.Description>
					<EmptyState.Actions>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ onChooseLocation }
						>
							{ __( 'Choose location' ) }
						</Button>
					</EmptyState.Actions>
				</EmptyState.Root>
			</div>
		);
	}

	const filteredLocations =
		filter === AREA_FILTERS.all
			? locations
			: locations.filter( ( location ) => location.area === filter );
	const emptyFilter =
		! filteredLocations.length && FILTER_EMPTY_STATES[ filter ]?.();

	return (
		<>
			<Notice.Root intent="info">
				<Notice.Description>
					{ locations.length === 1
						? sprintf(
								/* translators: %s: Where the menu is shown, like "Header". */
								__(
									'This menu appears in one place on your site, %s.'
								),
								locations[ 0 ].title
							)
						: sprintf(
								/* translators: %d: How many places the menu is shown. */
								__(
									'This menu appears in %d places on your site, shown below. Changes to the menu show in all of them.'
								),
								locations.length
							) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton
						variant="outline"
						onClick={ onChooseLocation }
					>
						{ __( 'Change where it appears' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
			<ToggleGroupControl
				label={ __( 'Show locations' ) }
				hideLabelFromVision
				isBlock
				value={ filter }
				onChange={ ( value ) => setFilter( value as string ) }
			>
				<ToggleGroupControlOption
					value={ AREA_FILTERS.all }
					label={ __( 'All' ) }
				/>
				<ToggleGroupControlOption
					value={ AREA_FILTERS.header }
					label={ __( 'Headers' ) }
				/>
				<ToggleGroupControlOption
					value={ AREA_FILTERS.footer }
					label={ __( 'Footers' ) }
				/>
				<ToggleGroupControlOption
					value={ NAVIGATION_OVERLAY_TEMPLATE_PART_AREA }
					label={ __( 'Overlays' ) }
				/>
			</ToggleGroupControl>
			{ filter === NAVIGATION_OVERLAY_TEMPLATE_PART_AREA &&
				filteredLocations.length > 0 && (
					<Text render={ <p /> } style={ STYLES.weak }>
						{ __(
							'An overlay is the menu that opens from a menu button, usually on phones and other small screens.'
						) }
					</Text>
				) }
			{ emptyFilter && (
				<div style={ STYLES.centered }>
					<EmptyState.Root>
						<EmptyState.Icon icon={ getAreaIcon( filter ) } />
						<EmptyState.Title>
							{ emptyFilter.title }
						</EmptyState.Title>
						<EmptyState.Description>
							{ emptyFilter.description }
						</EmptyState.Description>
					</EmptyState.Root>
				</div>
			) }
			<div style={ STYLES.list }>
				{ filteredLocations.map( ( location ) => (
					<LocationCard
						key={ location.id }
						location={ location }
						navigationId={ navigationId }
						menuTitle={ menuTitle }
						menus={ menus }
						onEditLocation={ onEditLocation }
					/>
				) ) }
			</div>
		</>
	);
}

/**
 * The menu's canvas: the front of the site with the menu in it, or each
 * place the menu is shown, with ways to edit those places and to change
 * where the menu shows.
 *
 * @param props
 * @param props.navigationId   The menu's ID.
 * @param props.onEditLocation Called with a template part record to open it
 *                             for editing.
 * @return The canvas.
 */
export default function MenuLocations( {
	navigationId,
	onEditLocation,
}: {
	navigationId: number | string;
	onEditLocation?: EditLocation;
} ) {
	const id = Number( navigationId );
	const { locations, otherLocations, menus, isResolving } =
		useMenuLocations( id );
	const [ view, setView ] = useState< string >( VIEW_PREVIEW );
	const [ isChoosing, setIsChoosing ] = useState( false );
	const editLocationBlocks = useEditLocationBlocks();
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const menu = menus.find( ( record ) => record.id === id );
	const menuTitle = menu ? getMenuTitle( menu ) : __( 'This menu' );
	const fallbackId = getFallbackMenuId( menus );

	const candidates = useMemo(
		() => [ ...locations, ...otherLocations ],
		[ locations, otherLocations ]
	);
	const initialSelectedIds = useMemo(
		() => locations.map( ( location ) => location.id ),
		[ locations ]
	);

	const applyLocations = ( selectedIds: string[] ) => {
		setIsChoosing( false );
		let skipped = 0;

		for ( const location of candidates ) {
			const isSelected = selectedIds.includes( location.id );
			const isShown = initialSelectedIds.includes( location.id );

			if ( isSelected && ! isShown ) {
				editLocationBlocks(
					location,
					setNavigationMenu(
						getTemplatePartBlocks( location.part ),
						() => true,
						id,
						{ onlyFirst: true }
					)
				);
			} else if ( ! isSelected && isShown ) {
				const outcome = getRemovalOutcome( menus, id );
				if ( ! outcome ) {
					skipped++;
					continue;
				}
				editLocationBlocks(
					location,
					getBlocksWithoutMenu( location, id, outcome, fallbackId )
				);
			}
		}

		if ( skipped ) {
			createErrorNotice(
				__(
					'Some places still show this menu. Publish another menu first, as a place with no menu chosen shows your newest menu.'
				),
				{ type: 'snackbar' }
			);
			return;
		}
		createSuccessNotice( __( 'Menu locations updated. Save to apply.' ), {
			type: 'snackbar',
		} );
	};

	const openChooser = () => setIsChoosing( true );

	let body: ReactElement;
	if ( isResolving ) {
		body = (
			<div style={ STYLES.centered }>
				<Spinner />
			</div>
		);
	} else if ( view === VIEW_PREVIEW ) {
		body = (
			<>
				{ ! locations.length && (
					<Notice.Root intent="warning">
						<Notice.Description>
							{ __(
								'This menu isn’t shown anywhere on your site yet, so it doesn’t appear in the preview.'
							) }
						</Notice.Description>
						<Notice.Actions>
							<Notice.ActionButton
								variant="outline"
								onClick={ openChooser }
							>
								{ __( 'Choose location' ) }
							</Notice.ActionButton>
						</Notice.Actions>
					</Notice.Root>
				) }
				<div style={ STYLES.preview }>
					<MenuSitePreview />
				</div>
			</>
		);
	} else {
		body = (
			<LocationsView
				locations={ locations }
				navigationId={ id }
				menuTitle={ menuTitle }
				menus={ menus }
				onEditLocation={ onEditLocation }
				onChooseLocation={ openChooser }
			/>
		);
	}

	return (
		<div className="menu-locations" style={ STYLES.root }>
			<div style={ STYLES.toolbar }>
				<Stack
					direction="row"
					align="center"
					justify="space-between"
					gap="md"
				>
					<ToggleGroupControl
						label={ __( 'View' ) }
						hideLabelFromVision
						isAdaptiveWidth
						value={ view }
						onChange={ ( value ) => setView( value as string ) }
					>
						<ToggleGroupControlOption
							value={ VIEW_PREVIEW }
							label={ __( 'Preview' ) }
						/>
						<ToggleGroupControlOption
							value={ VIEW_LOCATIONS }
							label={ __( 'Locations' ) }
						/>
					</ToggleGroupControl>
					<Stack
						direction="column"
						align="center"
						style={ STYLES.toolbarTitle }
					>
						<Text variant="heading-md" style={ STYLES.ellipsis }>
							{ menuTitle }
						</Text>
						<Text variant="body-sm" style={ STYLES.weak }>
							{ isResolving
								? ' '
								: getLocationsSummary( locations.length ) }
						</Text>
					</Stack>
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ openChooser }
						disabled={ isResolving }
						accessibleWhenDisabled
					>
						{ locations.length
							? __( 'Update locations' )
							: __( 'Choose location' ) }
					</Button>
				</Stack>
			</div>
			<div style={ STYLES.body }>{ body }</div>
			{ isChoosing && (
				<ChooseLocationModal
					candidates={ candidates }
					initialSelectedIds={ initialSelectedIds }
					isUpdate={ locations.length > 0 }
					onApply={ applyLocations }
					onClose={ () => setIsChoosing( false ) }
					navigationId={ id }
					menuTitle={ menuTitle }
					menus={ menus }
					fallbackMenuId={ fallbackId }
				/>
			) }
		</div>
	);
}
