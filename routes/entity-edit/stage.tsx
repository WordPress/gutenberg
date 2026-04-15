/**
 * WordPress dependencies
 */
import { useParams, useNavigate } from '@wordpress/route';
import { Page } from '@wordpress/admin-ui';
import {
	Button,
	TextControl,
	TextareaControl,
	ToggleControl,
	CheckboxControl,
	Panel,
	PanelBody,
	PanelRow,
	Spinner,
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
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';

interface EntityConfig {
	slug: string;
	entity_type: 'post_type' | 'taxonomy';
	_user_created: boolean;
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
		if ( sessionStorage.getItem( 'gutenberg_entity_saved' ) ) {
			sessionStorage.removeItem( 'gutenberg_entity_saved' );
			createSuccessNotice( __( 'Entity updated successfully.' ), {
				type: 'snackbar',
				id: 'entity-save-success',
			} );
		}
	}, [ createSuccessNotice ] );

	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
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
				sessionStorage.setItem( 'gutenberg_entity_saved', '1' );
				window.location.reload();
				return;
			}

			originalConfigRef.current = config;
			createSuccessNotice( __( 'Entity updated successfully.' ), {
				type: 'snackbar',
				id: 'entity-save-success',
			} );
		} catch {
			createErrorNotice( __( 'Failed to update entity.' ), {
				type: 'snackbar',
			} );
		}

		setIsSaving( false );
	}, [ config, entityType, slug, createSuccessNotice, createErrorNotice ] );

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
			<div style={ { maxWidth: 800, padding: '0 16px' } }>
				<VStack spacing={ 4 }>
					<Panel>
						<PanelBody title={ __( 'General' ) } initialOpen>
							<PanelRow>
								<TextControl
									__nextHasNoMarginBottom
									label={ __( 'Name (Plural)' ) }
									value={ config.labels?.name || '' }
									onChange={ ( value: string ) =>
										updateLabel( 'name', value )
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextControl
									__nextHasNoMarginBottom
									label={ __( 'Singular Name' ) }
									value={ config.labels?.singular_name || '' }
									onChange={ ( value: string ) =>
										updateLabel( 'singular_name', value )
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextControl
									__nextHasNoMarginBottom
									label={ __( 'Slug' ) }
									value={ config.slug }
									disabled
									readOnly
								/>
							</PanelRow>
							<PanelRow>
								<TextareaControl
									__nextHasNoMarginBottom
									label={ __( 'Description' ) }
									value={ config.description || '' }
									onChange={ ( value: string ) =>
										updateField( 'description', value )
									}
								/>
							</PanelRow>
						</PanelBody>
					</Panel>

					<Panel>
						<PanelBody title={ __( 'Visibility' ) } initialOpen>
							<PanelRow>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Public' ) }
									checked={ config.public }
									onChange={ ( value: boolean ) =>
										updateField( 'public', value )
									}
								/>
							</PanelRow>
							<PanelRow>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Hierarchical' ) }
									checked={ config.hierarchical }
									onChange={ ( value: boolean ) =>
										updateField( 'hierarchical', value )
									}
								/>
							</PanelRow>
							<PanelRow>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Show UI' ) }
									checked={ config.show_ui }
									onChange={ ( value: boolean ) =>
										updateField( 'show_ui', value )
									}
								/>
							</PanelRow>
							<PanelRow>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Show in Menu' ) }
									checked={ !! config.show_in_menu }
									onChange={ ( value: boolean ) =>
										updateField( 'show_in_menu', value )
									}
								/>
							</PanelRow>
							{ isPostType && (
								<PanelRow>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Has Archive' ) }
										checked={ !! config.has_archive }
										onChange={ ( value: boolean ) =>
											updateField( 'has_archive', value )
										}
									/>
								</PanelRow>
							) }
						</PanelBody>
					</Panel>

					<Panel>
						<PanelBody
							title={ __( 'REST API' ) }
							initialOpen={ false }
						>
							<PanelRow>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Show in REST' ) }
									checked={ config.show_in_rest }
									onChange={ ( value: boolean ) =>
										updateField( 'show_in_rest', value )
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextControl
									__nextHasNoMarginBottom
									label={ __( 'REST Base' ) }
									value={ config.rest_base || '' }
									onChange={ ( value: string ) =>
										updateField( 'rest_base', value )
									}
								/>
							</PanelRow>
						</PanelBody>
					</Panel>

					{ ! isPostType && (
						<Panel>
							<PanelBody title={ __( 'Post Types' ) } initialOpen>
								{ availablePostTypes.map( ( pt ) => (
									<PanelRow key={ pt.slug }>
										<CheckboxControl
											__nextHasNoMarginBottom
											label={ pt.labels?.name || pt.slug }
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
									</PanelRow>
								) ) }
								{ availablePostTypes.length === 0 && (
									<PanelRow>
										<p>
											{ __( 'No post types available.' ) }
										</p>
									</PanelRow>
								) }
							</PanelBody>
						</Panel>
					) }

					{ isPostType && (
						<Panel>
							<PanelBody
								title={ __( 'Menu' ) }
								initialOpen={ false }
							>
								<PanelRow>
									<TextControl
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
								</PanelRow>
								<PanelRow>
									<TextControl
										__nextHasNoMarginBottom
										label={ __( 'Menu Position' ) }
										type="number"
										value={
											config.menu_position !== null
												? String( config.menu_position )
												: ''
										}
										onChange={ ( value: string ) =>
											updateField(
												'menu_position',
												value ? Number( value ) : null
											)
										}
									/>
								</PanelRow>
							</PanelBody>
						</Panel>
					) }

					{ isPostType && (
						<Panel>
							<PanelBody
								title={ __( 'Supports' ) }
								initialOpen={ false }
							>
								{ POST_TYPE_SUPPORTS.map( ( feature ) => (
									<PanelRow key={ feature }>
										<CheckboxControl
											__nextHasNoMarginBottom
											label={ feature }
											checked={
												!! config.supports?.[ feature ]
											}
											onChange={ ( value: boolean ) =>
												updateSupport( feature, value )
											}
										/>
									</PanelRow>
								) ) }
							</PanelBody>
						</Panel>
					) }

					<Panel>
						<PanelBody
							title={ __( 'Labels' ) }
							initialOpen={ false }
						>
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
								<PanelRow key={ labelKey }>
									<TextControl
										__nextHasNoMarginBottom
										label={ labelKey }
										value={
											config.labels?.[ labelKey ] || ''
										}
										onChange={ ( value: string ) =>
											updateLabel( labelKey, value )
										}
									/>
								</PanelRow>
							) ) }
						</PanelBody>
					</Panel>
				</VStack>
			</div>
		</Page>
	);
}

export const stage = EntityEdit;
