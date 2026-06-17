/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
import { Button, Modal, Spinner } from '@wordpress/components';
import { Preview } from '@wordpress/lazy-editor';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, layout, navigation as navigationIcon } from '@wordpress/icons';
import { EmptyState, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import useNavigationLocations, {
	type NavigationLocation,
} from './use-navigation-locations';

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

function ChooseLocationModal( { onClose }: { onClose: () => void } ) {
	return (
		<Modal title={ __( 'Choose location' ) } onRequestClose={ onClose }>
			<Stack direction="column" gap="md">
				<Text>
					{ __(
						'This will let you choose where this menu should appear on your site, such as your header or footer.'
					) }
				</Text>
				<Text variant="muted">
					{ __(
						'For now, edit the site area directly to place this menu.'
					) }
				</Text>
				<div>
					<Button
						variant="primary"
						onClick={ onClose }
						__next40pxDefaultSize
					>
						{ __( 'Done' ) }
					</Button>
				</div>
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
	const [ selectedLocation, setSelectedLocation ] = useState<
		string | 'all' | undefined
	>();
	const [ isChooseLocationModalOpen, setIsChooseLocationModalOpen ] =
		useState( false );

	const locations = useMemo(
		() => ( navigationId ? locationsMap[ navigationId ] ?? [] : [] ),
		[ locationsMap, navigationId ]
	);
	const locationsSignature = locations
		.map( ( location ) => location.id )
		.join( ',' );

	useEffect( () => {
		if ( ! locations.length ) {
			setSelectedLocation( undefined );
			return;
		}

		setSelectedLocation(
			locations.length >= 3 ? 'all' : locations[ 0 ].id
		);
	}, [ locations, locations.length, locationsSignature, navigationId ] );

	const visibleLocations =
		selectedLocation === 'all'
			? locations
			: locations.filter(
					( location ) => location.id === selectedLocation
			  );
	const showAllLocationsOption = locations.length > 1;

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
							onClick={ () =>
								setIsChooseLocationModalOpen( true )
							}
							__next40pxDefaultSize
						>
							{ __( 'Choose location' ) }
						</Button>
					</EmptyState.Actions>
				</EmptyState.Root>
				{ isChooseLocationModalOpen && (
					<ChooseLocationModal
						onClose={ () => setIsChooseLocationModalOpen( false ) }
					/>
				) }
			</div>
		);
	}

	return (
		<div className="routes-navigation-locations-canvas">
			<div className="routes-navigation-locations-canvas__toolbar">
				<div className="routes-navigation-locations-canvas__toolbar-copy">
					<Text variant="body-sm" weight="600">
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
				{ showAllLocationsOption && (
					<div className="routes-navigation-locations-canvas__switcher">
						<Button
							variant={
								selectedLocation === 'all'
									? 'primary'
									: 'secondary'
							}
							size="compact"
							onClick={ () => setSelectedLocation( 'all' ) }
						>
							{ __( 'All locations' ) }
						</Button>
						{ locations.map( ( location ) => (
							<Button
								key={ location.id }
								variant={
									selectedLocation === location.id
										? 'primary'
										: 'secondary'
								}
								size="compact"
								onClick={ () =>
									setSelectedLocation( location.id )
								}
							>
								{ location.label }
							</Button>
						) ) }
					</div>
				) }
			</div>
			<div className="routes-navigation-locations-canvas__previews">
				{ visibleLocations.map( ( location ) => (
					<LocationPreviewCard
						key={ location.id }
						location={ location }
					/>
				) ) }
			</div>
		</div>
	);
}
