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
	// @ts-ignore
	__experimentalVStack as VStack,
	// @ts-ignore
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';

interface EntityConfig {
	slug: string;
	entity_type: 'post_type' | 'taxonomy';
	_user_created: boolean;
	labels?: Record< string, string >;
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

const DEFAULT_POST_TYPE_SUPPORTS: Record< string, boolean > = {
	title: true,
	editor: true,
};

interface NewEntityConfig {
	slug: string;
	labels: Record< string, string >;
	description: string;
	public: boolean;
	hierarchical: boolean;
	supports: Record< string, boolean >;
	has_archive: boolean;
	show_in_rest: boolean;
	rest_base: string;
	menu_icon: string;
	menu_position: number | null;
	show_ui: boolean;
	show_in_menu: boolean;
	object_type: string[];
}

function getDefaultConfig(): NewEntityConfig {
	return {
		slug: '',
		labels: {
			name: '',
			singular_name: '',
		},
		description: '',
		public: true,
		hierarchical: false,
		supports: { ...DEFAULT_POST_TYPE_SUPPORTS },
		has_archive: false,
		show_in_rest: true,
		rest_base: '',
		menu_icon: 'dashicons-admin-post',
		menu_position: null,
		show_ui: true,
		show_in_menu: true,
		object_type: [ 'post' ],
	};
}

function EntityNew() {
	const { entityType } = useParams( {
		from: '/new/$entityType',
	} );
	const navigate = useNavigate();
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const [ isSaving, setIsSaving ] = useState( false );
	const [ config, setConfig ] =
		useState< NewEntityConfig >( getDefaultConfig );
	const [ allConfigs, setAllConfigs ] = useState< EntityConfig[] >( [] );

	const isPostType = entityType === 'post_type';

	// Fetch all configs for taxonomy/post type assignment lists.
	useEffect( () => {
		apiFetch< EntityConfig[] >( {
			path: '/gutenberg/v1/entity-configs',
		} ).then( ( response ) => {
			setAllConfigs( response );
		} );
	}, [] );

	const availablePostTypes = useMemo(
		() => allConfigs.filter( ( c ) => c.entity_type === 'post_type' ),
		[ allConfigs ]
	);

	const updateField = useCallback(
		< K extends keyof NewEntityConfig >(
			field: K,
			value: NewEntityConfig[ K ]
		) => {
			setConfig( ( prev ) => ( { ...prev, [ field ]: value } ) );
		},
		[]
	);

	const updateLabel = useCallback( ( key: string, value: string ) => {
		setConfig( ( prev ) => ( {
			...prev,
			labels: { ...prev.labels, [ key ]: value },
		} ) );
	}, [] );

	const updateSupport = useCallback(
		( feature: string, enabled: boolean ) => {
			setConfig( ( prev ) => ( {
				...prev,
				supports: { ...prev.supports, [ feature ]: enabled },
			} ) );
		},
		[]
	);

	const toggleObjectType = useCallback(
		( postTypeSlug: string, assigned: boolean ) => {
			setConfig( ( prev ) => {
				const updated = assigned
					? [ ...prev.object_type, postTypeSlug ]
					: prev.object_type.filter( ( t ) => t !== postTypeSlug );
				return { ...prev, object_type: updated };
			} );
		},
		[]
	);

	const handleSave = useCallback( async () => {
		if ( ! config.slug ) {
			createErrorNotice( __( 'Slug is required.' ), {
				type: 'snackbar',
			} );
			return;
		}

		if ( ! config.labels.name ) {
			createErrorNotice( __( 'Name is required.' ), {
				type: 'snackbar',
			} );
			return;
		}

		setIsSaving( true );

		try {
			await apiFetch( {
				path: '/gutenberg/v1/entity-configs',
				method: 'POST',
				data: {
					entity_type: entityType,
					slug: config.slug,
					labels: config.labels,
					description: config.description,
					public: config.public,
					hierarchical: config.hierarchical,
					show_in_rest: config.show_in_rest,
					rest_base: config.rest_base || config.slug,
					show_ui: config.show_ui,
					show_in_menu: config.show_in_menu,
					...( isPostType
						? {
								supports: config.supports,
								has_archive: config.has_archive,
								menu_icon: config.menu_icon || null,
								menu_position: config.menu_position,
						  }
						: {
								object_type: config.object_type,
						  } ),
				},
			} );
			if ( config.show_in_menu || config.show_ui ) {
				sessionStorage.setItem( 'gutenberg_entity_saved', '1' );
				window.location.reload();
				return;
			}

			createSuccessNotice( __( 'Entity created successfully.' ), {
				type: 'snackbar',
				id: 'entity-save-success',
			} );
			navigate( { to: '/', search: { tab: entityType } } );
		} catch ( error: any ) {
			createErrorNotice(
				error?.message || __( 'Failed to create entity.' ),
				{ type: 'snackbar' }
			);
		}

		setIsSaving( false );
	}, [
		config,
		entityType,
		isPostType,
		navigate,
		createSuccessNotice,
		createErrorNotice,
	] );

	const pageTitle = isPostType ? __( 'New Post Type' ) : __( 'New Taxonomy' );

	return (
		<Page
			title={ pageTitle }
			actions={
				<HStack spacing={ 3 }>
					<Button
						variant="tertiary"
						onClick={ () =>
							navigate( { to: '/', search: { tab: entityType } } )
						}
						size="compact"
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ handleSave }
						isBusy={ isSaving }
						disabled={ isSaving }
						size="compact"
					>
						{ __( 'Create' ) }
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
									label={ __( 'Slug' ) }
									help={ __(
										'A unique identifier. Lowercase letters, numbers, and hyphens only.'
									) }
									value={ config.slug }
									onChange={ ( value: string ) =>
										updateField(
											'slug',
											value
												.toLowerCase()
												.replace( /[^a-z0-9_-]/g, '' )
										)
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextControl
									__nextHasNoMarginBottom
									label={ __( 'Name (Plural)' ) }
									value={ config.labels.name || '' }
									onChange={ ( value: string ) =>
										updateLabel( 'name', value )
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextControl
									__nextHasNoMarginBottom
									label={ __( 'Singular Name' ) }
									value={ config.labels.singular_name || '' }
									onChange={ ( value: string ) =>
										updateLabel( 'singular_name', value )
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextareaControl
									__nextHasNoMarginBottom
									label={ __( 'Description' ) }
									value={ config.description }
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
									checked={ config.show_in_menu }
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
									value={ config.rest_base }
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
											checked={ config.object_type.includes(
												pt.slug
											) }
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
											updateField( 'menu_icon', value )
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
												!! config.supports[ feature ]
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
				</VStack>
			</div>
		</Page>
	);
}

export const stage = EntityNew;
