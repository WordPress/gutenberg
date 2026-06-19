/**
 * WordPress dependencies
 */
import { useNavigate, useSearch, useInvalidate, Link } from '@wordpress/route';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
	type WpTemplate,
} from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	createInterpolateElement,
	useMemo,
	useCallback,
	useState,
} from '@wordpress/element';
import { Modal, Spinner, Tooltip as WCTooltip } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { page, postList } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { unlock } from '@wordpress/routes-lock-unlock';
import { Badge, Button, Icon, Stack, Text } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components

/**
 * Internal dependencies
 */
import { getTemplatePlaceholderItemId } from './view-utils';
import { isPageApplicableTemplate } from './template-utils';

const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );

type PageTemplateRecord = WpTemplate & {
	author?: number | string;
	author_text?: string;
	is_custom?: boolean;
	post_types?: string[];
	postTypes?: string[];
	meta?: {
		is_wp_suggestion?: boolean;
	};
	theme?: string;
	_isActive?: boolean;
	_isCustom?: boolean;
	_isPlaceholder?: boolean;
	wp_id?: number;
	_templateSlot?: TemplateSlot;
	_fallbackTemplateId?: string | number;
	_fallbackTemplateTitle?: string;
	site_editor_template_context?: {
		post_type?: string;
		slot?: TemplateSlotKind | null;
		canonical_slug?: string | null;
		is_specific?: boolean;
		is_active_slot?: boolean;
		is_active_fallback?: boolean;
	} | null;
};

type TemplateSlotKind = 'archive' | 'single';

type TemplateSlot = {
	kind: TemplateSlotKind;
	slug: string;
	title: string;
	description: string;
	activeFallbackSlugs?: string[];
};

type PostTypeObject = {
	has_archive?: boolean;
	labels?: {
		name?: string;
		singular_name?: string;
	};
	name?: string;
	slug?: string;
};

type TemplateAuthor = {
	name?: string;
};

type ThemeRecord = {
	name?:
		| {
				rendered?: string;
		  }
		| string;
	stylesheet?: string;
};

interface PostTypeTemplatesTabProps {
	postType: string;
}

function getItemId( item: PageTemplateRecord ) {
	return item.id.toString();
}

function getSearchPostIds( postIds?: string[] | string ) {
	if ( Array.isArray( postIds ) ) {
		return postIds;
	}

	return postIds ? [ postIds ] : [];
}

function getPostTypeLabel( postTypeObject: PostTypeObject | undefined ) {
	return (
		postTypeObject?.labels?.singular_name ||
		postTypeObject?.labels?.name ||
		postTypeObject?.name ||
		postTypeObject?.slug ||
		''
	);
}

function getPostTypePluralLabel( postTypeObject: PostTypeObject | undefined ) {
	return (
		postTypeObject?.labels?.name ||
		postTypeObject?.name ||
		postTypeObject?.labels?.singular_name ||
		postTypeObject?.slug ||
		''
	);
}

function getPostTypeSentenceLabel(
	postTypeObject: PostTypeObject | undefined
) {
	const label = getPostTypePluralLabel( postTypeObject );

	if ( ! label ) {
		return '';
	}

	return label.toLowerCase();
}

function getTemplateSlots(
	postType: string,
	postTypeObject: PostTypeObject | undefined
): TemplateSlot[] {
	if ( ! postTypeObject || postType === 'page' ) {
		return [];
	}

	const singularLabel = getPostTypeLabel( postTypeObject ) || postType;
	const pluralLabel = getPostTypePluralLabel( postTypeObject ) || postType;
	const slots: TemplateSlot[] = [];

	if ( postType === 'post' ) {
		slots.push( {
			kind: 'archive',
			slug: 'home',
			title: __( 'Blog Home' ),
			description: __(
				'Displays the blog posts index. If this template is not customized, the site uses the default index template.'
			),
		} );
	} else if ( postTypeObject.has_archive ) {
		slots.push( {
			kind: 'archive',
			slug: `archive-${ postType }`,
			title: sprintf(
				// translators: %s: Post type name, e.g. "Events".
				__( '%s listing' ),
				pluralLabel
			),
			description: sprintf(
				// translators: %s: Post type name, e.g. "Events".
				__(
					'Displays the %s archive. If this template is not customized, the site uses the default archive template.'
				),
				pluralLabel
			),
		} );
	}

	if ( postType === 'post' ) {
		slots.push( {
			kind: 'single',
			slug: 'single-post',
			title: __( 'Single Posts' ),
			description: __(
				'Displays individual posts. If this template is not customized, the site uses the default single template.'
			),
			activeFallbackSlugs: [ 'single' ],
		} );
	} else {
		slots.push( {
			kind: 'single',
			slug: `single-${ postType }`,
			title: sprintf(
				// translators: %s: Post type name, e.g. "Event".
				__( 'Single %s' ),
				singularLabel
			),
			description: sprintf(
				// translators: %s: Post type name, e.g. "Event".
				__(
					'Displays an individual %s. If this template is not customized, the site uses the default single template.'
				),
				singularLabel
			),
		} );
	}

	return slots;
}

function getSupportedPostTypes( record: PageTemplateRecord ) {
	return record.post_types || record.postTypes;
}

function supportsPostType( record: PageTemplateRecord, postType: string ) {
	const supportedPostTypes = getSupportedPostTypes( record );

	return Array.isArray( supportedPostTypes )
		? supportedPostTypes.includes( postType )
		: false;
}

function decodeTemplateText( value: string | undefined ) {
	return decodeEntities( ( value || '' ).replace( /<[^>]*>/g, ' ' ) ).trim();
}

function getPlaceholderDescription( slot: TemplateSlot ) {
	if ( slot.kind === 'archive' ) {
		return sprintf(
			// translators: %s: Template name, e.g. "Events listing".
			__(
				'%s is currently using the default listing template. Create a dedicated template to customize it without changing other content types.'
			),
			slot.title
		);
	}

	return sprintf(
		// translators: %s: Template name, e.g. "Single Event".
		__(
			'%s is currently using the default single template. Create a dedicated template to customize it without changing other content types.'
		),
		slot.title
	);
}

function getTemplateRecordTitle( record: PageTemplateRecord ) {
	if ( typeof record.title === 'string' ) {
		return decodeTemplateText( record.title );
	}

	return (
		decodeTemplateText( record.title?.rendered ) ||
		record.slug ||
		__( 'Template' )
	);
}

function getTemplateRecordDescription(
	record: PageTemplateRecord,
	postType: string
) {
	return (
		decodeTemplateText( record.description ) ||
		record._templateSlot?.description ||
		( postType === 'page' && record._isCustom
			? __( 'Custom page template.' )
			: '' ) ||
		''
	);
}

function getThemeName( activeTheme: ThemeRecord | undefined ) {
	if ( typeof activeTheme?.name === 'string' ) {
		return decodeTemplateText( activeTheme.name );
	}

	return decodeTemplateText( activeTheme?.name?.rendered );
}

function getTemplateAuthorText(
	record: PageTemplateRecord,
	activeTheme: ThemeRecord | undefined,
	authorsById: Record< string, TemplateAuthor | undefined >
) {
	const authorText = decodeTemplateText( record.author_text );
	if ( authorText ) {
		return authorText;
	}

	if ( record.author ) {
		const author = authorsById[ String( record.author ) ];
		if ( author?.name ) {
			return author.name;
		}
	}

	if ( record._isCustom ) {
		return __( 'User-created' );
	}

	if ( record.theme === activeTheme?.stylesheet ) {
		return getThemeName( activeTheme ) || record.theme || __( 'Theme' );
	}

	return record.theme || __( 'Unknown' );
}

function getTemplateActivationId( record: PageTemplateRecord ) {
	if ( typeof record.id === 'number' ) {
		return record.id;
	}

	if ( typeof record.wp_id === 'number' ) {
		return record.wp_id;
	}

	return undefined;
}

function isDefaultPageTemplate(
	record: PageTemplateRecord,
	activeTemplatesOption: Record< string, string | number > | undefined,
	activeThemeStylesheet: string | undefined
) {
	const activePageTemplateId = activeTemplatesOption?.page;

	if ( activePageTemplateId ) {
		const activationId = getTemplateActivationId( record );

		return (
			( activationId !== undefined &&
				String( activationId ) === String( activePageTemplateId ) ) ||
			String( record.id ) === String( activePageTemplateId )
		);
	}

	return (
		record.slug === 'page' &&
		( ! record.theme || record.theme === activeThemeStylesheet )
	);
}

function getTemplateIcon( record: PageTemplateRecord, postType: string ) {
	if ( postType === 'page' || record.slug === 'page' ) {
		return page;
	}

	if (
		record._templateSlot?.kind === 'archive' ||
		record.site_editor_template_context?.slot === 'archive'
	) {
		return postList;
	}

	return page;
}

function normalizeTemplateSearchText( value: string | undefined ) {
	return ( value || '' )
		.toLowerCase()
		.replace( /<[^>]*>/g, ' ' )
		.replace( /[_-]+/g, ' ' )
		.replace( /[^a-z0-9]+/g, ' ' )
		.trim();
}

function getTemplateSearchText( record: PageTemplateRecord ) {
	return normalizeTemplateSearchText(
		[
			record.slug,
			getTemplateRecordTitle( record ),
			record.description,
		].join( ' ' )
	);
}

function getPostTypeSearchTerms(
	postType: string,
	postTypeObject: PostTypeObject | undefined
) {
	const terms = new Set< string >();
	const candidates = [
		postType,
		...postType.split( /[_-]+/ ),
		postTypeObject?.labels?.singular_name,
		postTypeObject?.labels?.name,
		postTypeObject?.name,
		postTypeObject?.slug,
	];

	for ( const candidate of candidates ) {
		const normalizedCandidate = normalizeTemplateSearchText( candidate );
		for ( const term of normalizedCandidate.split( ' ' ) ) {
			if ( term.length > 2 ) {
				terms.add( term );
				if ( term.endsWith( 's' ) && term.length > 3 ) {
					terms.add( term.slice( 0, -1 ) );
				}
			}
		}
	}

	return [ ...terms ];
}

function recordMatchesSlotKind(
	record: PageTemplateRecord,
	slot: TemplateSlot
) {
	const text = getTemplateSearchText( record );
	const archiveTerms = [ 'archive', 'listing', 'list' ];
	const singleTerms = [ 'single', 'detail', 'item' ];
	const terms = slot.kind === 'archive' ? archiveTerms : singleTerms;

	return terms.some( ( term ) => text.split( ' ' ).includes( term ) );
}

function recordMatchesPostType(
	record: PageTemplateRecord,
	postType: string,
	postTypeObject: PostTypeObject | undefined
) {
	if ( supportsPostType( record, postType ) ) {
		return true;
	}

	const textTerms = getTemplateSearchText( record ).split( ' ' );
	return getPostTypeSearchTerms( postType, postTypeObject ).some( ( term ) =>
		textTerms.includes( term )
	);
}

function isExternalTemplate(
	record: PageTemplateRecord,
	activeThemeStylesheet: string | undefined
) {
	return !! record.theme && record.theme !== activeThemeStylesheet;
}

function isTemplateSlotRecord(
	record: PageTemplateRecord,
	slot: TemplateSlot,
	postType: string,
	postTypeObject: PostTypeObject | undefined,
	activeThemeStylesheet: string | undefined
) {
	const context = record.site_editor_template_context;
	if ( context?.post_type === postType ) {
		return (
			context.is_active_slot &&
			context.slot === slot.kind &&
			context.canonical_slug === slot.slug
		);
	}

	if (
		record.slug === slot.slug ||
		( !! record.slug && slot.activeFallbackSlugs?.includes( record.slug ) )
	) {
		return true;
	}

	if ( supportsPostType( record, postType ) ) {
		return recordMatchesSlotKind( record, slot );
	}

	if ( ! isExternalTemplate( record, activeThemeStylesheet ) ) {
		return false;
	}

	return (
		recordMatchesPostType( record, postType, postTypeObject ) &&
		recordMatchesSlotKind( record, slot )
	);
}

export function PostTypeTemplatesTab( {
	postType,
}: PostTypeTemplatesTabProps ) {
	const invalidate = useInvalidate();
	const navigate = useNavigate();
	const [ isCreatingTemplate, setIsCreatingTemplate ] = useState( false );
	const searchParams = useSearch( { from: '/types/$type/list/$slug' } );
	const createTemplateSlug = ( searchParams as { createTemplate?: string } )
		.createTemplate;
	const { records, isResolving, hasResolved } =
		useEntityRecordsWithPermissions( 'postType', 'wp_template', {
			per_page: -1,
			...( postType === 'page' ? {} : { post_type: postType } ),
		} );
	const isTemplateActivateEnabled =
		typeof window !== 'undefined' &&
		(
			window as typeof window & {
				__experimentalTemplateActivate?: boolean;
			}
		 ).__experimentalTemplateActivate;
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const {
		activeTemplatesOption,
		activeTheme,
		defaultTemplateTypes,
		postTypeObject,
	} = useSelect(
		( select ) => {
			const { getEntityRecord, getCurrentTheme, getPostType } =
				select( coreStore );
			const currentTheme = getCurrentTheme();
			return {
				activeTemplatesOption: getEntityRecord( 'root', 'site' )
					?.active_templates,
				activeTheme: currentTheme,
				defaultTemplateTypes:
					currentTheme?.default_template_types || [],
				postTypeObject: getPostType( postType ),
			};
		},
		[ postType ]
	);
	const templateSlots = useMemo(
		() =>
			getTemplateSlots(
				postType,
				postTypeObject as PostTypeObject | undefined
			),
		[ postType, postTypeObject ]
	);
	const slotLookups = useSelect(
		( select ) => {
			const store = select( coreStore ) as any;
			return templateSlots.map( ( slot ) => {
				const query = { slug: slot.slug };
				const templateId = store.getDefaultTemplateId( query );
				const template = templateId
					? store.getEntityRecord(
							'postType',
							'wp_template',
							templateId
					  )
					: undefined;

				return {
					slot,
					template,
					templateId,
					hasResolved:
						store.hasFinishedResolution( 'getDefaultTemplateId', [
							query,
						] ) &&
						( ! templateId ||
							store.hasFinishedResolution( 'getEntityRecord', [
								'postType',
								'wp_template',
								templateId,
							] ) ),
				};
			} );
		},
		[ templateSlots ]
	);
	const areSlotLookupsResolving = slotLookups.some(
		( lookup ) => ! lookup.hasResolved
	);
	const templates = useMemo( () => {
		function isCustom( record: PageTemplateRecord ) {
			return (
				record.is_custom ??
				( ! record.meta?.is_wp_suggestion &&
					! defaultTemplateTypes.some(
						( type: any ) => type.slug === record.slug
					) )
			);
		}

		function normalizeRecord( record: PageTemplateRecord ) {
			const activeTemplateId = activeTemplatesOption?.[ record.slug ];
			const isThemeTemplate =
				typeof record.id === 'string' &&
				record.theme === activeTheme?.stylesheet;

			return {
				...record,
				_isActive: activeTemplateId
					? String( activeTemplateId ) === String( record.id )
					: isThemeTemplate,
				_isCustom: isCustom( record ),
			};
		}

		const normalizedRecords = ( ( records || [] ) as PageTemplateRecord[] )
			.map( normalizeRecord )
			.filter( ( record ) => !! record.slug );

		if ( postType === 'page' ) {
			return normalizedRecords.filter( isPageApplicableTemplate );
		}

		const slotTemplates = templateSlots
			.map( ( slot ) => {
				const existingTemplate = normalizedRecords.find(
					( record ) => record.slug === slot.slug
				);

				if ( existingTemplate ) {
					return {
						...existingTemplate,
						_isActive: true,
						_isCustom: false,
					};
				}

				const matchingTemplate = normalizedRecords.find( ( record ) =>
					isTemplateSlotRecord(
						record,
						slot,
						postType,
						postTypeObject as PostTypeObject | undefined,
						activeTheme?.stylesheet
					)
				);

				if ( matchingTemplate ) {
					return {
						...matchingTemplate,
						_isActive: true,
						_isCustom: false,
					};
				}

				const lookup = slotLookups.find(
					( slotLookup ) => slotLookup.slot.slug === slot.slug
				);
				const fallbackTemplate = lookup?.template as
					| PageTemplateRecord
					| undefined;

				if ( ! lookup?.hasResolved || ! fallbackTemplate ) {
					return null;
				}

				if (
					fallbackTemplate.slug === slot.slug ||
					( !! fallbackTemplate.slug &&
						slot.activeFallbackSlugs?.includes(
							fallbackTemplate.slug
						) )
				) {
					return {
						...normalizeRecord( fallbackTemplate ),
						_isActive: true,
						_isCustom: false,
					};
				}

				return {
					...fallbackTemplate,
					id: getTemplatePlaceholderItemId( slot.slug ),
					slug: slot.slug,
					title: {
						rendered: slot.title,
					},
					description: getPlaceholderDescription( slot ),
					_isActive: false,
					_isCustom: false,
					_isPlaceholder: true,
					_templateSlot: slot,
					_fallbackTemplateId: fallbackTemplate.id,
					_fallbackTemplateTitle:
						getTemplateRecordTitle( fallbackTemplate ),
				} as PageTemplateRecord;
			} )
			.filter( Boolean ) as PageTemplateRecord[];

		return slotTemplates;
	}, [
		activeTemplatesOption,
		activeTheme,
		defaultTemplateTypes,
		postType,
		postTypeObject,
		records,
		slotLookups,
		templateSlots,
	] );
	const authorIds = useMemo(
		() => [
			...new Set(
				templates
					.map( ( template ) => Number( template.author ) )
					.filter( ( authorId ) => Number.isFinite( authorId ) )
			),
		],
		[ templates ]
	);
	const authorsById = useSelect(
		( select ) => {
			const store = select( coreStore ) as any;
			return authorIds.reduce(
				( result, authorId ) => ( {
					...result,
					[ authorId ]: store.getUser( authorId ),
				} ),
				{} as Record< string, TemplateAuthor | undefined >
			);
		},
		[ authorIds ]
	);
	const selectedSearchPostIds = getSearchPostIds(
		( searchParams as { postIds?: string[] | string } ).postIds
	);
	const selectedSearchItemId = selectedSearchPostIds.find( ( itemId ) =>
		templates.some( ( template ) => getItemId( template ) === itemId )
	);
	const selectedTemplate = selectedSearchItemId
		? templates.find(
				( template ) => getItemId( template ) === selectedSearchItemId
		  )
		: templates[ 0 ];
	const selectedItemId = selectedTemplate
		? getItemId( selectedTemplate )
		: undefined;
	const isLoading = isResolving || ! hasResolved || areSlotLookupsResolving;
	const selectTemplate = useCallback(
		( template: PageTemplateRecord ) => {
			navigate( {
				search: {
					...searchParams,
					createTemplate: undefined,
					edit: undefined,
					postIds: [ getItemId( template ) ],
				},
			} );
		},
		[ navigate, searchParams ]
	);
	const selectedPlaceholder = templates.find(
		( template ) =>
			template._isPlaceholder && template.slug === createTemplateSlug
	);
	const closeCreateTemplateModal = useCallback( () => {
		navigate( {
			search: {
				...searchParams,
				createTemplate: undefined,
			},
		} );
	}, [ navigate, searchParams ] );
	const createTemplateFromPlaceholder = useCallback(
		async ( template: PageTemplateRecord ) => {
			if ( isCreatingTemplate || ! template._templateSlot ) {
				return;
			}

			setIsCreatingTemplate( true );
			try {
				const newTemplate = ( await saveEntityRecord(
					'postType',
					'wp_template',
					{
						content: template.content?.raw || '',
						description: template._templateSlot.description,
						slug: template.slug,
						status: 'publish',
						title: template._templateSlot.title,
						meta: {
							is_wp_suggestion: true,
						},
					},
					{ throwOnError: true }
				) ) as PageTemplateRecord;

				if ( isTemplateActivateEnabled ) {
					await saveEntityRecord(
						'root',
						'site',
						{
							active_templates: {
								...( activeTemplatesOption ?? {} ),
								[ template.slug ]: newTemplate.id,
							},
						},
						{ throwOnError: true }
					);
				}

				createSuccessNotice(
					sprintf(
						// translators: %s: Template title.
						__( '"%s" successfully created.' ),
						getTemplateRecordTitle( newTemplate )
					),
					{
						type: 'snackbar',
					}
				);

				invalidate();
				navigate( {
					to: `/types/wp_template/edit/${ encodeURIComponent(
						String( newTemplate.id )
					) }`,
				} );
			} catch ( error: any ) {
				createErrorNotice(
					error.message && error.code !== 'unknown_error'
						? error.message
						: __(
								'An error occurred while creating the template.'
						  ),
					{
						type: 'snackbar',
					}
				);
			} finally {
				setIsCreatingTemplate( false );
			}
		},
		[
			activeTemplatesOption,
			createErrorNotice,
			createSuccessNotice,
			invalidate,
			isCreatingTemplate,
			isTemplateActivateEnabled,
			navigate,
			saveEntityRecord,
		]
	);

	return (
		<>
			<Stack
				direction="column"
				gap="md"
				style={ { padding: '16px 24px' } }
			>
				{ isLoading && templates.length === 0 && (
					<Stack justify="center" align="center">
						<Spinner />
					</Stack>
				) }
				{ ! isLoading && templates.length === 0 && (
					<Text
						variant="body-sm"
						style={ {
							color: 'var(--wpds-color-foreground-content-neutral-weak)',
						} }
					>
						{ __( 'No templates found.' ) }
					</Text>
				) }
				{ templates.length > 0 && (
					<Text
						variant="body-sm"
						render={ <p /> }
						style={ {
							color: 'var(--wpds-color-foreground-content-neutral-weak)',
							margin: 0,
						} }
					>
						{ postType === 'page'
							? __(
									'Templates control the layout used by pages on your site. The default template is used unless a page has a different template selected.'
							  )
							: sprintf(
									// translators: %s: Plural post type label, e.g. "posts", "products", or "books".
									__(
										'These templates control how all %s appear on your site, including listings and individual items.'
									),
									getPostTypeSentenceLabel(
										postTypeObject as
											| PostTypeObject
											| undefined
									) || postType
							  ) }
					</Text>
				) }
				{ templates.map( ( template ) => {
					const itemId = getItemId( template );
					const isSelected = itemId === selectedItemId;
					const isDefaultPage =
						postType === 'page' &&
						isDefaultPageTemplate(
							template,
							activeTemplatesOption as
								| Record< string, string | number >
								| undefined,
							activeTheme?.stylesheet
						);
					const isActive =
						postType === 'page'
							? isDefaultPage
							: !! template._isActive;
					const description = getTemplateRecordDescription(
						template,
						postType
					);
					const authorText = getTemplateAuthorText(
						template,
						activeTheme as ThemeRecord | undefined,
						authorsById
					);

					return (
						<Button
							key={ itemId }
							type="button"
							variant="outline"
							tone={ isSelected ? 'brand' : 'neutral' }
							className={
								isActive || postType === 'page'
									? 'routes-post-list__template-card'
									: 'routes-post-list__template-card is-inactive'
							}
							aria-pressed={ isSelected }
							onClick={ () => selectTemplate( template ) }
							style={ {
								alignItems: 'stretch',
								height: 'auto',
								justifyContent: 'stretch',
								padding: '12px',
								textAlign: 'start',
								width: '100%',
							} }
						>
							<Stack
								direction="row"
								gap="md"
								align="flex-start"
								style={ { width: '100%' } }
							>
								<span
									aria-hidden="true"
									style={ {
										alignItems: 'center',
										background:
											'var(--wpds-color-background-surface-neutral-weak)',
										borderRadius: '4px',
										color: 'var(--wpds-color-foreground-content-neutral)',
										display: 'inline-flex',
										flex: '0 0 40px',
										height: '40px',
										justifyContent: 'center',
										width: '40px',
									} }
								>
									<Icon
										icon={ getTemplateIcon(
											template,
											postType
										) }
										size={ 20 }
									/>
								</span>
								<Stack
									direction="column"
									gap="xs"
									style={ {
										flex: '1 1 auto',
										minWidth: 0,
									} }
								>
									<Text
										variant="body-sm"
										style={ {
											fontWeight: 600,
											whiteSpace: 'normal',
										} }
									>
										{ getTemplateRecordTitle( template ) }
									</Text>
									{ postType === 'page' ? (
										isDefaultPage && (
											<WCTooltip
												text={ __(
													'Pages without a custom template use this default template.'
												) }
											>
												<span>
													<Badge
														intent="stable"
														style={ {
															alignSelf:
																'flex-start',
															overflowWrap:
																'normal',
															whiteSpace:
																'nowrap',
														} }
													>
														{ __( 'Default' ) }
													</Badge>
												</span>
											</WCTooltip>
										)
									) : (
										<Badge
											intent={
												isActive ? 'stable' : 'none'
											}
											style={ {
												alignSelf: 'flex-start',
												overflowWrap: 'normal',
												whiteSpace: 'nowrap',
											} }
										>
											{ isActive
												? __( 'Active' )
												: __( 'Inactive' ) }
										</Badge>
									) }
									{ !! description && (
										<Text
											variant="body-sm"
											style={ {
												color: 'var(--wpds-color-foreground-content-neutral-weak)',
												whiteSpace: 'normal',
											} }
										>
											{ description }
										</Text>
									) }
									<Text
										variant="body-sm"
										style={ {
											color: 'var(--wpds-color-foreground-content-neutral-weak)',
											whiteSpace: 'normal',
										} }
									>
										{ sprintf(
											// translators: %s: Template author name.
											__( 'Author: %s' ),
											authorText
										) }
									</Text>
								</Stack>
							</Stack>
						</Button>
					);
				} ) }
				{ templates.length > 0 && (
					<Text
						variant="body-sm"
						render={ <p /> }
						style={ {
							color: 'var(--wpds-color-foreground-content-neutral-weak)',
							margin: 0,
						} }
					>
						{ createInterpolateElement(
							sprintf(
								// translators: %s: Post type singular label, e.g. "Page", "Post", or "Event".
								__(
									'For more advanced control over %s templates, <link>view all templates</link>.'
								),
								getPostTypeLabel(
									postTypeObject as PostTypeObject | undefined
								) || postType
							),
							{
								// @ts-ignore Children are injected by createInterpolateElement.
								link: <Link to="/templates" />,
							}
						) }
					</Text>
				) }
			</Stack>
			{ selectedPlaceholder && selectedPlaceholder._templateSlot && (
				<Modal
					title={ sprintf(
						// translators: %s: Template name, e.g. "Single Event".
						__( 'Create %s template' ),
						selectedPlaceholder._templateSlot.title
					) }
					onRequestClose={ closeCreateTemplateModal }
					size="small"
				>
					<Stack direction="column" gap="md">
						<p>
							{ getPlaceholderDescription(
								selectedPlaceholder._templateSlot
							) }
						</p>
						{ selectedPlaceholder._fallbackTemplateId && (
							<p>
								{ sprintf(
									// translators: %s: Fallback template title.
									__(
										'The new template will start with the current fallback content from "%s".'
									),
									selectedPlaceholder._fallbackTemplateTitle ||
										__( 'the fallback template' )
								) }
							</p>
						) }
						<Stack direction="row" justify="flex-end" gap="sm">
							<Button
								variant="minimal"
								tone="neutral"
								onClick={ closeCreateTemplateModal }
								disabled={ isCreatingTemplate }
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								variant="solid"
								tone="brand"
								loading={ isCreatingTemplate }
								onClick={ () =>
									createTemplateFromPlaceholder(
										selectedPlaceholder
									)
								}
							>
								{ sprintf(
									// translators: %s: Template name, e.g. "Single Event".
									__( 'Create %s' ),
									selectedPlaceholder._templateSlot.title
								) }
							</Button>
						</Stack>
					</Stack>
				</Modal>
			) }
		</>
	);
}
