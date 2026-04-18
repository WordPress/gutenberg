/**
 * WordPress dependencies
 */
import { useParams, useNavigate } from '@wordpress/route';
import { Page } from '@wordpress/admin-ui';
import {
	Button,
	Notice,
	TextControl,
	TextareaControl,
	ToggleControl,
	CheckboxControl,
	Spinner,
	privateApis as componentsPrivateApis,
	// @ts-ignore
	__experimentalConfirmDialog as ConfirmDialog,
	// @ts-ignore
	__experimentalVStack as VStack,
	// @ts-ignore
	__experimentalHStack as HStack,
} from '@wordpress/components';
import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { trash, undo } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

interface EntityConfig {
	slug: string;
	entity_type: 'post_type' | 'taxonomy';
	_user_created: boolean;
	_source: 'core' | 'plugin' | 'user';
	_orphaned: boolean;
	_customized: boolean;
	labels: Record< string, string >;
	description: string;
	public: boolean;
	hierarchical: boolean;
	supports?: Record< string, boolean >;
	has_archive?: boolean | string;
	rewrite?: { slug?: string } | boolean;
	show_in_rest: boolean;
	rest_base: string;
	menu_icon?: string | null;
	menu_position?: number | null;
	show_ui: boolean;
	show_in_menu: boolean | string;
	object_type?: string[];
}

const POST_TYPE_SUPPORTS = [
	'title',
	'editor',
	'author',
	'thumbnail',
	'excerpt',
	'trackbacks',
	'custom-fields',
	'comments',
	'revisions',
	'page-attributes',
	'post-formats',
];

function EntityEdit() {
	const { entityType, slug } = useParams( {
		from: '/edit/$entityType/$slug',
	} );
	const navigate = useNavigate();
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	// Show a success notice if we just reloaded after a menu-affecting save.
	useEffect( () => {
		const message = sessionStorage.getItem( 'gutenberg_entity_saved' );
		if ( message ) {
			sessionStorage.removeItem( 'gutenberg_entity_saved' );
			createSuccessNotice( message, {
				type: 'snackbar',
				id: 'entity-save-success',
			} );
		}
	}, [ createSuccessNotice ] );

	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ showDeleteConfirm, setShowDeleteConfirm ] = useState( false );
	const [ config, setConfig ] = useState< EntityConfig | null >( null );
	const [ allConfigs, setAllConfigs ] = useState< EntityConfig[] >( [] );
	const originalConfigRef = useRef< EntityConfig | null >( null );

	// Fetch the entity config and all configs (for taxonomy/post type lists).
	useEffect( () => {
		setIsLoading( true );
		Promise.all( [
			apiFetch< EntityConfig >( {
				path: `/gutenberg/v1/entity-configs/${ entityType }/${ slug }`,
			} ),
			apiFetch< EntityConfig[] >( {
				path: '/gutenberg/v1/entity-configs',
			} ),
		] )
			.then( ( [ entityResponse, allResponse ] ) => {
				setConfig( entityResponse );
				originalConfigRef.current = entityResponse;
				setAllConfigs( allResponse );
				setIsLoading( false );
			} )
			.catch( () => {
				setIsLoading( false );
			} );
	}, [ entityType, slug ] );

	// Available post types for taxonomy assignment panel.
	const availablePostTypes = useMemo(
		() => allConfigs.filter( ( c ) => c.entity_type === 'post_type' ),
		[ allConfigs ]
	);

	const updateField = useCallback(
		< K extends keyof EntityConfig >(
			field: K,
			value: EntityConfig[ K ]
		) => {
			setConfig(
				( prev ) =>
					( {
						...prev!,
						[ field ]: value,
					} ) as EntityConfig
			);
		},
		[]
	);

	const updateLabel = useCallback( ( key: string, value: string ) => {
		setConfig(
			( prev ) =>
				( {
					...prev!,
					labels: {
						...prev!.labels,
						[ key ]: value,
					},
				} ) as EntityConfig
		);
	}, [] );

	const updateSupport = useCallback(
		( feature: string, enabled: boolean ) => {
			setConfig(
				( prev ) =>
					( {
						...prev!,
						supports: {
							...prev!.supports,
							[ feature ]: enabled,
						},
					} ) as EntityConfig
			);
		},
		[]
	);

	const toggleObjectType = useCallback(
		( postTypeSlug: string, assigned: boolean ) => {
			setConfig( ( prev ) => {
				const current = prev!.object_type ?? [];
				const updated = assigned
					? [ ...current, postTypeSlug ]
					: current.filter( ( t ) => t !== postTypeSlug );
				return { ...prev!, object_type: updated } as EntityConfig;
			} );
		},
		[]
	);

	const handleSave = useCallback( async () => {
		if ( ! config ) {
			return;
		}

		setIsSaving( true );

		try {
			await apiFetch( {
				path: `/gutenberg/v1/entity-configs/${ entityType }/${ slug }`,
				method: 'PUT',
				data: {
					labels: config.labels,
					description: config.description,
					public: config.public,
					hierarchical: config.hierarchical,
					show_in_rest: config.show_in_rest,
					rest_base: config.rest_base,
					show_ui: config.show_ui,
					show_in_menu: config.show_in_menu,
					rewrite: config.rewrite,
					...( entityType === 'post_type'
						? {
								supports: config.supports,
								has_archive: config.has_archive,
								menu_icon: config.menu_icon,
								menu_position: config.menu_position,
						  }
						: {
								object_type: config.object_type,
						  } ),
				},
			} );

			const prev = originalConfigRef.current;
			const menuChanged =
				prev?.labels?.name !== config.labels?.name ||
				prev?.labels?.menu_name !== config.labels?.menu_name ||
				prev?.show_ui !== config.show_ui ||
				prev?.show_in_menu !== config.show_in_menu ||
				prev?.menu_icon !== config.menu_icon ||
				prev?.menu_position !== config.menu_position ||
				JSON.stringify( prev?.object_type ) !==
					JSON.stringify( config.object_type );

			if ( menuChanged ) {
				sessionStorage.setItem(
					'gutenberg_entity_saved',
					__( 'Entity updated successfully.' )
				);
				window.location.reload();
				return;
			}

			originalConfigRef.current = config;
			createSuccessNotice( __( 'Entity updated successfully.' ), {
				type: 'snackbar',
				id: 'entity-save-success',
			} );
		} catch ( error: any ) {
			createErrorNotice(
				error?.message || __( 'Failed to update entity.' ),
				{
					type: 'snackbar',
					id: 'entity-save-error',
				}
			);
		}

		setIsSaving( false );
	}, [ config, entityType, slug, createSuccessNotice, createErrorNotice ] );

	// Core and active plugin entities are "reverted" (overrides cleared;
	// core/plugin re-registers them on next request). User-created and orphaned
	// entities are "deleted" (stored config removed). Revert is only available
	// when the entity has actually been customized.
	const isRevert =
		( config?._source === 'plugin' || config?._source === 'core' ) &&
		! config?._orphaned &&
		!! config?._customized;

	const handleDelete = useCallback( async () => {
		setIsDeleting( true );
		try {
			await apiFetch( {
				path: `/gutenberg/v1/entity-configs/${ entityType }/${ slug }`,
				method: 'DELETE',
			} );
			sessionStorage.setItem(
				'gutenberg_entity_saved',
				isRevert
					? __( 'Entity reverted successfully.' )
					: __( 'Entity deleted successfully.' )
			);
			// Always reload — a deleted/reverted entity affects the admin menu.
			const url = new URL( window.location.href );
			url.searchParams.set( 'p', '/' );
			url.searchParams.set( 'tab', entityType );
			window.location.href = url.toString();
		} catch {
			createErrorNotice(
				isRevert
					? __( 'Failed to revert entity.' )
					: __( 'Failed to delete entity.' ),
				{
					type: 'snackbar',
					id: 'entity-delete-error',
				}
			);
			setIsDeleting( false );
			setShowDeleteConfirm( false );
		}
	}, [ entityType, slug, isRevert, createErrorNotice ] );

	if ( isLoading ) {
		return (
			<Page title={ __( 'Edit Entity' ) }>
				<Spinner />
			</Page>
		);
	}

	if ( ! config ) {
		return (
			<Page title={ __( 'Edit Entity' ) }>
				<p>{ __( 'Entity not found.' ) }</p>
			</Page>
		);
	}

	const isPostType = entityType === 'post_type';
	const pageTitle = `${ __( 'Edit' ) }: ${
		config.labels?.name || config.slug
	}`;

	return (
		<>
			<Page
				title={ pageTitle }
				actions={
					<HStack spacing={ 3 }>
						<Button
							variant="tertiary"
							onClick={ () =>
								navigate( {
									to: '/',
									search: { tab: entityType },
								} )
							}
							size="compact"
						>
							{ __( 'Back' ) }
						</Button>
						{ ( config._user_created ||
							config._orphaned ||
							isRevert ) && (
							<Button
								icon={ isRevert ? undo : trash }
								label={
									isRevert
										? __( 'Revert to default' )
										: __( 'Delete' )
								}
								isDestructive={ ! isRevert }
								onClick={ () => setShowDeleteConfirm( true ) }
								disabled={ isDeleting }
								size="compact"
							/>
						) }
						<Button
							variant="primary"
							onClick={ handleSave }
							isBusy={ isSaving }
							disabled={ isSaving }
							size="compact"
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				}
			>
				<div style={ { padding: 16 } }>
					<VStack spacing={ 4 }>
						{ config._orphaned && (
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'This entity is no longer registered. The plugin or theme that created it may be deactivated. Saving changes will have no effect until it is registered again.'
								) }
							</Notice>
						) }
						{ ! config._orphaned && config._source === 'core' && (
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Warning: you are editing a core WordPress entity. Changes might have unexpected consequences.'
								) }
							</Notice>
						) }
						{ ! config._orphaned && config._source === 'plugin' && (
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Warning: you are editing an entity registered by a plugin or theme. If it is updated or deactivated, your changes may be lost.'
								) }
							</Notice>
						) }
						<Tabs>
							<Tabs.TabList>
								<Tabs.Tab tabId="general">
									{ __( 'General' ) }
								</Tabs.Tab>
								<Tabs.Tab tabId="visibility">
									{ __( 'Visibility' ) }
								</Tabs.Tab>
								<Tabs.Tab tabId="rest-api">
									{ __( 'REST API' ) }
								</Tabs.Tab>
								{ ! isPostType && (
									<Tabs.Tab tabId="post-types">
										{ __( 'Post Types' ) }
									</Tabs.Tab>
								) }
								{ isPostType && (
									<Tabs.Tab tabId="menu">
										{ __( 'Menu' ) }
									</Tabs.Tab>
								) }
								{ isPostType && (
									<Tabs.Tab tabId="supports">
										{ __( 'Supports' ) }
									</Tabs.Tab>
								) }
								<Tabs.Tab tabId="labels">
									{ __( 'Labels' ) }
								</Tabs.Tab>
							</Tabs.TabList>

							<Tabs.TabPanel tabId="general" focusable={ false }>
								<VStack spacing={ 4 }>
									<TextControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Name (Plural)' ) }
										value={ config.labels?.name || '' }
										onChange={ ( value: string ) =>
											updateLabel( 'name', value )
										}
									/>
									<TextControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Singular Name' ) }
										value={
											config.labels?.singular_name || ''
										}
										onChange={ ( value: string ) =>
											updateLabel(
												'singular_name',
												value
											)
										}
									/>
									<TextControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Slug' ) }
										value={ config.slug }
										disabled
										readOnly
									/>
									<TextareaControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Description' ) }
										value={ config.description || '' }
										onChange={ ( value: string ) =>
											updateField( 'description', value )
										}
									/>
								</VStack>
							</Tabs.TabPanel>

							<Tabs.TabPanel
								tabId="visibility"
								focusable={ false }
							>
								<VStack spacing={ 3 }>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Public' ) }
										checked={ config.public }
										onChange={ ( value: boolean ) =>
											updateField( 'public', value )
										}
									/>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Hierarchical' ) }
										checked={ config.hierarchical }
										onChange={ ( value: boolean ) =>
											updateField( 'hierarchical', value )
										}
									/>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Show UI' ) }
										checked={ config.show_ui }
										onChange={ ( value: boolean ) =>
											updateField( 'show_ui', value )
										}
									/>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Show in Menu' ) }
										checked={ !! config.show_in_menu }
										onChange={ ( value: boolean ) =>
											updateField( 'show_in_menu', value )
										}
									/>
									{ isPostType && (
										<ToggleControl
											__nextHasNoMarginBottom
											label={ __( 'Has Archive' ) }
											checked={ !! config.has_archive }
											onChange={ ( value: boolean ) =>
												updateField(
													'has_archive',
													value
												)
											}
										/>
									) }
								</VStack>
							</Tabs.TabPanel>

							<Tabs.TabPanel tabId="rest-api" focusable={ false }>
								<VStack spacing={ 4 }>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Show in REST' ) }
										checked={ config.show_in_rest }
										onChange={ ( value: boolean ) =>
											updateField( 'show_in_rest', value )
										}
									/>
									<TextControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'REST Base' ) }
										value={ config.rest_base || '' }
										onChange={ ( value: string ) =>
											updateField( 'rest_base', value )
										}
									/>
								</VStack>
							</Tabs.TabPanel>

							{ ! isPostType && (
								<Tabs.TabPanel
									tabId="post-types"
									focusable={ false }
								>
									<VStack spacing={ 3 }>
										{ availablePostTypes.map( ( pt ) => (
											<CheckboxControl
												key={ pt.slug }
												__nextHasNoMarginBottom
												label={
													pt.labels?.name || pt.slug
												}
												checked={
													config.object_type?.includes(
														pt.slug
													) ?? false
												}
												onChange={ ( value: boolean ) =>
													toggleObjectType(
														pt.slug,
														value
													)
												}
											/>
										) ) }
										{ availablePostTypes.length === 0 && (
											<p>
												{ __(
													'No post types available.'
												) }
											</p>
										) }
									</VStack>
								</Tabs.TabPanel>
							) }

							{ isPostType && (
								<Tabs.TabPanel tabId="menu" focusable={ false }>
									<VStack spacing={ 4 }>
										<TextControl
											__next40pxDefaultSize
											__nextHasNoMarginBottom
											label={ __( 'Menu Icon' ) }
											help={ __(
												'A dashicon class name or URL to an icon image.'
											) }
											value={ config.menu_icon || '' }
											onChange={ ( value: string ) =>
												updateField(
													'menu_icon',
													value || null
												)
											}
										/>
										<TextControl
											__next40pxDefaultSize
											__nextHasNoMarginBottom
											label={ __( 'Menu Position' ) }
											type="number"
											value={
												config.menu_position !== null
													? String(
															config.menu_position
													  )
													: ''
											}
											onChange={ ( value: string ) =>
												updateField(
													'menu_position',
													value
														? Number( value )
														: null
												)
											}
										/>
									</VStack>
								</Tabs.TabPanel>
							) }

							{ isPostType && (
								<Tabs.TabPanel
									tabId="supports"
									focusable={ false }
								>
									<VStack spacing={ 3 }>
										{ POST_TYPE_SUPPORTS.map(
											( feature ) => (
												<CheckboxControl
													key={ feature }
													__nextHasNoMarginBottom
													label={ feature }
													checked={
														!! config.supports?.[
															feature
														]
													}
													onChange={ (
														value: boolean
													) =>
														updateSupport(
															feature,
															value
														)
													}
												/>
											)
										) }
									</VStack>
								</Tabs.TabPanel>
							) }

							<Tabs.TabPanel tabId="labels" focusable={ false }>
								<VStack spacing={ 4 }>
									{ [
										'add_new',
										'add_new_item',
										'edit_item',
										'new_item',
										'view_item',
										'view_items',
										'search_items',
										'not_found',
										'not_found_in_trash',
										'all_items',
										'menu_name',
									].map( ( labelKey ) => (
										<TextControl
											__next40pxDefaultSize
											key={ labelKey }
											__nextHasNoMarginBottom
											label={ labelKey }
											value={
												config.labels?.[ labelKey ] ||
												''
											}
											onChange={ ( value: string ) =>
												updateLabel( labelKey, value )
											}
										/>
									) ) }
								</VStack>
							</Tabs.TabPanel>
						</Tabs>
					</VStack>
				</div>
			</Page>
			{ showDeleteConfirm && (
				<ConfirmDialog
					isOpen
					onConfirm={ handleDelete }
					onCancel={ () => setShowDeleteConfirm( false ) }
					confirmButtonText={
						isRevert ? __( 'Revert' ) : __( 'Delete' )
					}
					isBusy={ isDeleting }
				>
					{ isRevert
						? sprintf(
								/* translators: %s: entity name */
								__(
									'Are you sure you want to revert "%s" to its default state? All your customizations will be lost.'
								),
								config.labels?.name || config.slug
						  )
						: sprintf(
								/* translators: %s: entity name */
								__( 'Are you sure you want to delete "%s"?' ),
								config.labels?.name || config.slug
						  ) }
				</ConfirmDialog>
			) }
		</>
	);
}

export const stage = EntityEdit;
