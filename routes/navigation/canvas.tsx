/* @jsx createElement */
/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import { createElement, Fragment, useMemo, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Preview, Editor, useEditorAssets } from '@wordpress/lazy-editor';
import {
	Button,
	CheckboxControl,
	DropdownMenu,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Icon,
	MenuGroup,
	MenuItem,
	Modal,
	Spinner,
} from '@wordpress/components';
import {
	privateApis as editorPrivateApis,
	getTemplatePartIcon,
} from '@wordpress/editor';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import type { WpTemplatePart } from '@wordpress/core-data';
import { chevronDown } from '@wordpress/icons';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { parse, serialize, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useMenuUsedInTemplateParts from './use-menu-used-in-template-parts';
import { unlock } from '../lock-unlock';
import './canvas.scss';

const { patternTitleField } = unlock( editorPrivateApis );

const PatternTitle = patternTitleField.render as ( props: any ) => JSX.Element;

const titleField = {
	...patternTitleField,
	render: ( props: { item: WpTemplatePart } ) => (
		<HStack justify="flex-start" spacing={ 1 }>
			<Icon icon={ getTemplatePartIcon( props.item.area ) } size={ 24 } />
			<PatternTitle { ...props } />
		</HStack>
	),
};

const NAVIGATION_POST_TYPE = 'wp_navigation';
const LAYOUT_GRID = 'grid';
const MAX_PREVIEW_SIZE = 430;

const DEFAULT_VIEW = {
	type: LAYOUT_GRID as const,
	perPage: 20,
	titleField: 'title',
	mediaField: 'preview',
	fields: [],
	layout: { previewSize: MAX_PREVIEW_SIZE },
};

const DEFAULT_LAYOUTS = {
	[ LAYOUT_GRID ]: {},
};

const MODE_NAVIGATION = 'navigation';
const MODE_ALL = 'all';

const STATIC_AREAS = [
	{ value: 'header', label: __( 'Header' ) },
	{ value: 'footer', label: __( 'Footer' ) },
	{ value: 'sidebar', label: __( 'Panel' ) },
	{ value: 'navigation-overlay', label: __( 'Navigation Overlay' ) },
	{ value: 'uncategorized', label: __( 'General' ) },
] as const;

const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: ( { item }: { item: WpTemplatePart } ) => {
		return (
			<Preview
				content={ item?.content?.raw }
				blocks={ item?.blocks }
				description={ item.description }
			/>
		);
	},
	enableSorting: false,
};

function findFirstNavigationBlock( blocks: any[] ): any | null {
	const stack = [ ...blocks ];
	while ( stack.length ) {
		const block = stack.shift();
		if ( block.name === 'core/navigation' ) {
			return block;
		}
		if ( block.innerBlocks?.length ) {
			stack.unshift( ...block.innerBlocks );
		}
	}
	return null;
}

function setFirstNavigationRef(
	rawContent: string,
	navigationId: number
): any[] {
	const blocks = parse( rawContent || '' );
	let replaced = false;
	const updateInBlocks = ( blockList: any[] ): any[] =>
		blockList.map( ( block ) => {
			if ( ! replaced && block.name === 'core/navigation' ) {
				replaced = true;
				return createBlock( 'core/navigation', {
					...block.attributes,
					ref: navigationId,
				} );
			}
			if ( ! replaced && block.innerBlocks?.length ) {
				return {
					...block,
					innerBlocks: updateInBlocks( block.innerBlocks ),
				};
			}
			return block;
		} );
	return updateInBlocks( blocks );
}

function AddToTemplatePartModal( {
	navigationId,
	excludeIds,
	onClose,
}: {
	navigationId: number;
	excludeIds: Set< string >;
	onClose: () => void;
} ) {
	const { records: templateParts, isResolving } = useEntityRecords(
		'postType',
		'wp_template_part',
		{ per_page: -1 }
	);
	// @ts-expect-error - editEntityRecord types
	const { editEntityRecord } = useDispatch( 'core' );
	const [ selectedIds, setSelectedIds ] = useState< Set< string > >(
		() => new Set()
	);
	const [ isSaving, setIsSaving ] = useState( false );

	const toggleSelection = useCallback( ( id: string ) => {
		setSelectedIds( ( prev ) => {
			const next = new Set( prev );
			if ( next.has( id ) ) {
				next.delete( id );
			} else {
				next.add( id );
			}
			return next;
		} );
	}, [] );

	const handleApply = useCallback( async () => {
		setIsSaving( true );
		try {
			const parts = ( templateParts as WpTemplatePart[] ).filter(
				( part ) => selectedIds.has( String( part.id ) )
			);
			for ( const part of parts ) {
				const existingBlocks = parse( part?.content?.raw || '' );
				const navBlock = findFirstNavigationBlock( existingBlocks );
				if ( navBlock ) {
					navBlock.attributes.ref = navigationId;
				} else {
					existingBlocks.push(
						createBlock( 'core/navigation', {
							ref: navigationId,
						} )
					);
				}
				const updatedContent = serialize( existingBlocks );
				await editEntityRecord(
					'postType',
					'wp_template_part',
					part.id,
					{ content: { raw: updatedContent } }
				);
			}
			onClose();
		} catch {
			setIsSaving( false );
		}
	}, [ templateParts, selectedIds, navigationId, editEntityRecord, onClose ] );

	return (
		<Modal
			title={ __( 'Add to template part' ) }
			onRequestClose={ onClose }
			size="large"
		>
			{ isResolving || isSaving ? (
				<div style={ { display: 'flex', justifyContent: 'center', padding: '24px' } }>
					<Spinner />
				</div>
			) : (
				<VStack spacing={ 4 }>
					<div className="navigation-canvas__template-part-grid">
						{ ( templateParts as WpTemplatePart[] )?.filter(
							( part ) => ! excludeIds.has( String( part.id ) )
						).map(
							( part ) => {
								const id = String( part.id );
								const title =
									part.title?.rendered ||
									part.slug ||
									id;
								return (
									<label
										key={ id }
										className="navigation-canvas__template-part-card"
									>
										<div className="navigation-canvas__template-part-preview">
											<Preview
												blocks={
													setFirstNavigationRef(
														part?.content?.raw || '',
														navigationId
													)
												}
												description={
													part.description
												}
											/>
										</div>
										<HStack
											className="navigation-canvas__template-part-footer"
											justify="flex-start"
											spacing={ 2 }
										>
											<CheckboxControl
												__nextHasNoMarginBottom
												checked={ selectedIds.has(
													id
												) }
												onChange={ () =>
													toggleSelection( id )
												}
											/>
											<Icon
												icon={ getTemplatePartIcon(
													part.area
												) }
												size={ 24 }
											/>
											<span>{ title }</span>
										</HStack>
									</label>
								);
							}
						) }
					</div>
					<HStack justify="flex-end">
						<Button
							variant="tertiary"
							onClick={ onClose }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							disabled={ selectedIds.size === 0 }
							onClick={ handleApply }
						>
							{ __( 'Apply' ) }
						</Button>
					</HStack>
				</VStack>
			) }
		</Modal>
	);
}

function NavigationPreview( { navigationId }: { navigationId: number } ) {
	const navigate = useNavigate();
	const { isReady: assetsReady } = useEditorAssets();
	const editLink = `/types/wp_navigation/edit/${ navigationId }`;

	if ( ! assetsReady ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
				} }
			>
				<Spinner />
			</div>
		);
	}

	return (
		<div className="navigation-canvas__preview-wrap">
			<div
				style={ { height: '100%' } }
				// @ts-expect-error inert not typed properly
				inert="true"
			>
				<Editor
					key={ navigationId }
					postType={ NAVIGATION_POST_TYPE }
					postId={ navigationId }
					settings={ {
						isPreviewMode: true,
						styles: [ { css: 'body{min-height:100vh;}' } ],
					} }
				/>
			</div>
			<div
				onClick={ () => navigate( { to: editLink } ) }
				onKeyDown={ ( e ) => {
					if ( e.key === 'Enter' || e.key === ' ' ) {
						e.preventDefault();
						navigate( { to: editLink } );
					}
				} }
				style={ {
					position: 'absolute',
					inset: 0,
					cursor: 'pointer',
					zIndex: 9999,
				} }
				role="button"
				tabIndex={ 0 }
				aria-label={ __( 'Edit navigation menu' ) }
			/>
		</div>
	);
}

function Canvas() {
	const searchParams = useSearch( { strict: false } );
	const navigate = useNavigate();

	const canvasMode = ( searchParams as any ).canvas ?? MODE_ALL;
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const [ showAddModal, setShowAddModal ] = useState( false );

	const navigationId = useMemo( () => {
		const editId = ( searchParams as any ).editId as number | undefined;
		if ( editId ) {
			return editId;
		}
		if ( searchParams.ids?.[ 0 ] ) {
			return searchParams.ids[ 0 ] as number;
		}
		return 0;
	}, [ searchParams ] );

	const { templateParts, isResolving: isResolvingParts } =
		useMenuUsedInTemplateParts( navigationId );

	// IDs of template parts already using this navigation menu.
	const usedTemplatePartIds = useMemo( () => {
		const ids = new Set< string >();
		for ( const part of templateParts as WpTemplatePart[] ) {
			ids.add( String( part.id ) );
		}
		return ids;
	}, [ templateParts ] );

	// Read edited (unsaved) content for each template part so previews
	// reflect newly-assigned navigation refs immediately.
	const editedTemplateParts = useSelect(
		( select ) => {
			if ( ! ( templateParts as WpTemplatePart[] )?.length ) {
				return templateParts as WpTemplatePart[];
			}
			// @ts-expect-error - getEditedEntityRecord types
			const { getEditedEntityRecord } = select( 'core' );
			return ( templateParts as WpTemplatePart[] ).map( ( part ) => {
				const edited = getEditedEntityRecord(
					'postType',
					'wp_template_part',
					part.id
				);
				if ( edited?.content?.raw !== part?.content?.raw ) {
					return {
						...part,
						content: edited.content,
					};
				}
				return part;
			} );
		},
		[ templateParts ]
	);

	// Track which areas have at least one matching template part.
	const usedAreas = useMemo( () => {
		const areas = new Set< string >();
		for ( const part of templateParts as WpTemplatePart[] ) {
			if ( part.area ) {
				areas.add( part.area );
			}
		}
		return areas;
	}, [ templateParts ] );

	let currentLabel: string;
	if ( canvasMode === MODE_NAVIGATION ) {
		currentLabel = __( 'Navigation Preview' );
	} else if ( canvasMode === MODE_ALL ) {
		currentLabel = __( 'All Template Parts' );
	} else {
		currentLabel =
			STATIC_AREAS.find( ( a ) => a.value === canvasMode )?.label ??
			canvasMode;
	}

	// Filter template parts for the DataViews based on the selected mode.
	// Use editedTemplateParts so previews reflect pending edits.
	const visibleTemplateParts = useMemo( () => {
		if ( canvasMode === MODE_ALL || canvasMode === MODE_NAVIGATION ) {
			return editedTemplateParts;
		}
		return ( editedTemplateParts as WpTemplatePart[] ).filter(
			( part ) => part.area === canvasMode
		);
	}, [ editedTemplateParts, canvasMode ] );

	const hasNoTemplateParts =
		! isResolvingParts && ( templateParts as WpTemplatePart[] ).length === 0;

	const fields = useMemo( () => [ previewField, titleField ], [] );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( visibleTemplateParts, view, fields ),
		[ visibleTemplateParts, view, fields ]
	);

	if ( ! navigationId ) {
		return null;
	}

	return (
	<Fragment>
		<div className="navigation-canvas">
			<HStack
				justify="center"
				alignment="center"
				className="navigation-canvas__toolbar"
			>
				{ hasNoTemplateParts ? (
					<span className="navigation-canvas__toolbar-message">
						{ __( "This navigation menu isn't used anywhere yet" ) }
					</span>
				) : (
					<DropdownMenu
						label={ currentLabel }
						text={ currentLabel }
						icon={ chevronDown }
						toggleProps={ {
							iconPosition: 'right',
							className: 'navigation-canvas__mode-toggle',
							showTooltip: false,
						} }
					>
						{ ( { onClose } ) => (
							<Fragment>
								<MenuGroup>
									<MenuItem
										isSelected={ canvasMode === MODE_ALL }
										onClick={ () => {
											navigate( {
												search: {
													...searchParams,
													canvas: MODE_ALL,
												},
											} );
											onClose();
										} }
									>
										{ __( 'All Template Parts' ) }
									</MenuItem>
									{ STATIC_AREAS.map( ( { value, label } ) => (
										<MenuItem
											key={ value }
											icon={ getTemplatePartIcon( value ) }
											isSelected={ canvasMode === value }
											disabled={ ! usedAreas.has( value ) }
											onClick={ () => {
												navigate( {
													search: {
														...searchParams,
														canvas: value,
													},
												} );
												onClose();
											} }
										>
											{ label }
										</MenuItem>
									) ) }
								</MenuGroup>
								<MenuGroup>
									<MenuItem
										isSelected={
											canvasMode === MODE_NAVIGATION
										}
										onClick={ () => {
											navigate( {
												search: {
													...searchParams,
													canvas: MODE_NAVIGATION,
												},
											} );
											onClose();
										} }
									>
										{ __( 'Navigation Preview' ) }
									</MenuItem>
								</MenuGroup>
							</Fragment>
						) }
					</DropdownMenu>
				) }
				<Button
					variant="link"
					onClick={ () => setShowAddModal( true ) }
				>
					{ __( 'Add to template part' ) }
				</Button>
			</HStack>

			<hr className="navigation-canvas__divider" />

			{ canvasMode === MODE_NAVIGATION || hasNoTemplateParts ? (
				<div className="navigation-canvas__preview">
					<NavigationPreview navigationId={ navigationId } />
				</div>
			) : (
				<div
					className={
						( view.layout as { previewSize?: number } )
							?.previewSize >= MAX_PREVIEW_SIZE
							? 'navigation-canvas__dataviews navigation-canvas__dataviews--full-width'
							: 'navigation-canvas__dataviews'
					}
				>
					<DataViews
						paginationInfo={ paginationInfo }
						fields={ fields }
						data={ data ?? [] }
						isLoading={ isResolvingParts }
						view={ view }
						onChangeView={ setView }
						defaultLayouts={ DEFAULT_LAYOUTS }
						onClickItem={ ( item: WpTemplatePart ) => {
							navigate( {
								to: `/types/wp_template_part/edit/${ encodeURIComponent(
									String( item.id )
								) }`,
							} );
						} }
					>
						<DataViews.Layout />
						<DataViews.Footer />
					</DataViews>
				</div>
			) }
		</div>
		{ showAddModal && (
			<AddToTemplatePartModal
				navigationId={ navigationId }
				excludeIds={ usedTemplatePartIds }
				onClose={ () => setShowAddModal( false ) }
			/>
		) }
	</Fragment>
	);
}

// Export as both Canvas (for React component rules) and canvas (for route framework)
export { Canvas };
export { Canvas as canvas };
