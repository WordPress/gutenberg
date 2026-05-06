/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	InspectorControls,
	store as blockEditorStore,
	__experimentalUseBlockPreview as useBlockPreview,
} from '@wordpress/block-editor';
import { useEntityBlockEditor, store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';
import { useSelect, useRegistry } from '@wordpress/data';
import { useLayoutEffect, useMemo, useState } from '@wordpress/element';
import {
	Placeholder,
	Spinner,
	ToolbarButton,
	PanelBody,
	SelectControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import icon from './icon';
import { selectWrapModeClientIds } from './select-wrap-mode-client-ids';

/**
 * Hierarchy used to find a default preview template when the user is editing
 * `root.html` directly and hasn't picked one explicitly. Walks the same
 * precedence WordPress uses to resolve the home page on the frontend.
 */
const HOMEPAGE_FALLBACKS = [ 'front-page', 'home', 'index' ];

/**
 * Stabilises the array reference returned from selectors so it only changes
 * when contents change. `getBlockOrder` returns a fresh array per state
 * mutation; without this every dispatch would invalidate dependent effects
 * and re-trigger the dispatches that caused the state mutation, looping.
 *
 * @param {string[]} clientIds Array of client ids to memoise by content.
 * @return {string[]} Memoised reference to `clientIds`.
 */
function useStableClientIds( clientIds ) {
	return useMemo(
		() => clientIds,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ clientIds.join( ',' ) ]
	);
}

/**
 * Locks the canvas to "edit only the inner template's blocks" when the Site
 * Editor wraps a non-root template inside `root.html`.
 *
 * `core/template-content` can be nested at any depth in `root.html`, so we
 * categorise blocks relative to it rather than relative to the canvas root:
 *
 *   - `core/template-content` itself stays `'contentOnly'` (visible in List
 *     View, not directly editable).
 *   - Its descendants stay `'default'` so the inner template is editable.
 *   - Its ancestors become `'contentOnly'`. They contain template-content as
 *     a descendant, so they can't be marked `'disabled'` (that would
 *     propagate to template-content). `'contentOnly'` keeps them clickable.
 *   - Every other block (lateral chrome — siblings of an ancestor or of
 *     template-content itself, plus those siblings' descendants):
 *     - The "chrome top" (sibling whose parent is an ancestor or the canvas
 *       root) becomes `'contentOnly'` so users can select it for the
 *       "Edit root template" affordance.
 *     - Everything beneath a chrome top becomes `'disabled'` (inert), so
 *       clicks on internals bubble up to the chrome top.
 *
 * We do NOT lock the canvas root (`''`) here. Setting `''` to `'disabled'`
 * would propagate `inert` to every chrome top via derivation, swallowing
 * the very clicks the affordance needs to react to.
 *
 * Each effect uses a stabilised dep array + read-before-dispatch guard.
 * `setBlockEditingMode` writes to a Map even on no-op writes, which would
 * otherwise loop: dispatch → state mutates → selector returns new array →
 * effect re-runs → dispatch → … .
 *
 * @param {string|null} clientId The `core/template-content` block's id.
 */
export function useWrapModeLocking( clientId ) {
	const {
		ancestorClientIds,
		innerChildClientIds,
		chromeTopClientIds,
		chromeDescendantClientIds,
	} = useSelect(
		( select ) =>
			selectWrapModeClientIds( select( blockEditorStore ), clientId ),
		[ clientId ]
	);

	const registry = useRegistry();
	const stableAncestorClientIds = useStableClientIds( ancestorClientIds );
	const stableInnerChildClientIds = useStableClientIds( innerChildClientIds );
	const stableChromeTopClientIds = useStableClientIds( chromeTopClientIds );
	const stableChromeDescendantClientIds = useStableClientIds(
		chromeDescendantClientIds
	);

	useLayoutEffect( () => {
		if ( ! clientId ) {
			return;
		}
		const { getBlockEditingMode } = registry.select( blockEditorStore );
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );
		if ( getBlockEditingMode( clientId ) !== 'contentOnly' ) {
			setBlockEditingMode( clientId, 'contentOnly' );
		}
		return () => {
			unsetBlockEditingMode( clientId );
		};
	}, [ clientId, registry ] );

	useLayoutEffect( () => {
		if ( stableAncestorClientIds.length === 0 ) {
			return;
		}
		const { getBlockEditingMode } = registry.select( blockEditorStore );
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );
		const toSet = stableAncestorClientIds.filter(
			( id ) => getBlockEditingMode( id ) !== 'contentOnly'
		);
		if ( toSet.length > 0 ) {
			registry.batch( () => {
				for ( const id of toSet ) {
					setBlockEditingMode( id, 'contentOnly' );
				}
			} );
		}
		return () => {
			registry.batch( () => {
				for ( const id of stableAncestorClientIds ) {
					unsetBlockEditingMode( id );
				}
			} );
		};
	}, [ stableAncestorClientIds, registry ] );

	useLayoutEffect( () => {
		if ( stableInnerChildClientIds.length === 0 ) {
			return;
		}
		const { getBlockEditingMode } = registry.select( blockEditorStore );
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );
		const toSet = stableInnerChildClientIds.filter(
			( id ) => getBlockEditingMode( id ) !== 'default'
		);
		if ( toSet.length > 0 ) {
			registry.batch( () => {
				for ( const id of toSet ) {
					setBlockEditingMode( id, 'default' );
				}
			} );
		}
		return () => {
			registry.batch( () => {
				for ( const id of stableInnerChildClientIds ) {
					unsetBlockEditingMode( id );
				}
			} );
		};
	}, [ stableInnerChildClientIds, registry ] );

	useLayoutEffect( () => {
		if ( stableChromeTopClientIds.length === 0 ) {
			return;
		}
		const { getBlockEditingMode } = registry.select( blockEditorStore );
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );
		const toSet = stableChromeTopClientIds.filter(
			( id ) => getBlockEditingMode( id ) !== 'contentOnly'
		);
		if ( toSet.length > 0 ) {
			registry.batch( () => {
				for ( const id of toSet ) {
					setBlockEditingMode( id, 'contentOnly' );
				}
			} );
		}
		return () => {
			registry.batch( () => {
				for ( const id of stableChromeTopClientIds ) {
					unsetBlockEditingMode( id );
				}
			} );
		};
	}, [ stableChromeTopClientIds, registry ] );

	useLayoutEffect( () => {
		if ( stableChromeDescendantClientIds.length === 0 ) {
			return;
		}
		const { getBlockEditingMode } = registry.select( blockEditorStore );
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );
		const toSet = stableChromeDescendantClientIds.filter(
			( id ) => getBlockEditingMode( id ) !== 'disabled'
		);
		if ( toSet.length > 0 ) {
			registry.batch( () => {
				for ( const id of toSet ) {
					setBlockEditingMode( id, 'disabled' );
				}
			} );
		}
		return () => {
			registry.batch( () => {
				for ( const id of stableChromeDescendantClientIds ) {
					unsetBlockEditingMode( id );
				}
			} );
		};
	}, [ stableChromeDescendantClientIds, registry ] );
}

/**
 * Wrap-mode rendering: the user navigated to a non-root template (e.g.
 * `archive`) but the Site Editor is wrapping it in `root.html`. The inner
 * template's blocks render here as fully editable inner blocks; their edits
 * round-trip to the inner template's entity. Root chrome around us is
 * locked via `useWrapModeLocking`.
 *
 * @param {Object} props                 Component props.
 * @param {string} props.innerTemplateId The inner template entity id (e.g.
 *                                       `theme//archive`).
 * @param {Object} props.blockProps      Props returned by `useBlockProps`.
 * @param {string} props.clientId        The current block's client id.
 */
function WrapModeEdit( { innerTemplateId, blockProps, clientId } ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template',
		{ id: innerTemplateId }
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
		templateLock: false,
	} );

	useWrapModeLocking( clientId );

	if ( ! blocks ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ icon }
					label={ __( 'Template Content' ) }
					instructions={ __( 'Loading template…' ) }
				>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	return <div { ...innerBlocksProps } />;
}

/**
 * Direct-edit-root rendering: the user is editing `root.html`. Show a
 * non-editable preview of the active theme's home-hierarchy fallback (or a
 * user-picked template) inside this slot, with an "Edit template" button to
 * open the previewed template in the regular template editor.
 *
 * @param {Object} props            Component props.
 * @param {Object} props.blockProps Props returned by `useBlockProps`.
 */
function PreviewModeEdit( { blockProps } ) {
	// Per-session local state — the previewed template is an editor-only
	// convenience, not data the theme author wants persisted into the saved
	// root template's HTML.
	const [ previewedTemplate, setPreviewedTemplate ] = useState( undefined );

	const { stylesheet, themeTemplates } = useSelect( ( select ) => {
		const { getCurrentTheme, getEntityRecords } = select( coreStore );
		const sheet = getCurrentTheme()?.stylesheet;
		const records = getEntityRecords( 'postType', 'wp_template', {
			per_page: -1,
		} );
		return {
			stylesheet: sheet ?? null,
			themeTemplates:
				records && sheet
					? records.filter( ( t ) => t.theme === sheet )
					: null,
		};
	}, [] );

	// 1. The user's session-local pick, if any.
	// 2. Else the first of `front-page` / `home` / `index` that exists.
	const templateId = useMemo( () => {
		if ( ! stylesheet ) {
			return null;
		}
		if ( previewedTemplate ) {
			return `${ stylesheet }//${ previewedTemplate }`;
		}
		if ( ! themeTemplates ) {
			return null;
		}
		const availableSlugs = new Set( themeTemplates.map( ( t ) => t.slug ) );
		for ( const slug of HOMEPAGE_FALLBACKS ) {
			if ( availableSlugs.has( slug ) ) {
				return `${ stylesheet }//${ slug }`;
			}
		}
		return null;
	}, [ stylesheet, previewedTemplate, themeTemplates ] );

	// Read the previewed template's content directly. We deliberately avoid
	// `useEntityBlockEditor` here because its `_id ?? providerId` fallback
	// would resolve to the surrounding entity (the root template itself)
	// when `templateId` is null, causing recursive preview.
	const content = useSelect(
		( select ) => {
			if ( ! templateId ) {
				return null;
			}
			// `getEntityRecord` triggers the resolver on first call.
			const record = select( coreStore ).getEntityRecord(
				'postType',
				'wp_template',
				templateId
			);
			return record?.content?.raw ?? null;
		},
		[ templateId ]
	);

	const previewBlocks = useMemo( () => {
		return content ? parse( content ) : [];
	}, [ content ] );

	const blockPreviewProps = useBlockPreview( {
		blocks: previewBlocks,
		props: blockProps,
	} );

	const onNavigateToEntityRecord = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().onNavigateToEntityRecord,
		[]
	);

	const canEditPreviewedTemplate = useSelect(
		( select ) =>
			!! templateId &&
			!! select( coreStore ).canUser( 'update', {
				kind: 'postType',
				name: 'wp_template',
				id: templateId,
			} ),
		[ templateId ]
	);

	const previewOptions = useMemo( () => {
		const fallbackOption = {
			label: __( 'Default (home page)' ),
			value: '',
		};
		if ( ! themeTemplates ) {
			return [ fallbackOption ];
		}
		return [
			fallbackOption,
			...themeTemplates
				.filter( ( t ) => t.slug !== 'root' )
				.map( ( t ) => ( {
					label: t.title?.rendered || t.slug,
					value: t.slug,
				} ) ),
		];
	}, [ themeTemplates ] );

	const inspector = (
		<InspectorControls>
			<PanelBody title={ __( 'Preview' ) }>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Preview template' ) }
					help={ __(
						'Pick which template to render inside this block while editing. The frontend always uses the WordPress hierarchy regardless of this setting; the choice is not saved.'
					) }
					value={ previewedTemplate ?? '' }
					options={ previewOptions }
					onChange={ ( value ) =>
						setPreviewedTemplate( value || undefined )
					}
				/>
			</PanelBody>
		</InspectorControls>
	);

	const editTemplateToolbar = templateId &&
		canEditPreviewedTemplate &&
		onNavigateToEntityRecord && (
			<BlockControls group="other">
				<ToolbarButton
					onClick={ () =>
						onNavigateToEntityRecord( {
							postId: templateId,
							postType: 'wp_template',
							focusMode: false,
						} )
					}
				>
					{ __( 'Edit template' ) }
				</ToolbarButton>
			</BlockControls>
		);

	const isLoaded = templateId !== null && content !== null;
	const hasContent = isLoaded && previewBlocks.length > 0;

	if ( hasContent ) {
		return (
			<>
				{ editTemplateToolbar }
				{ inspector }
				<div { ...blockPreviewProps } />
			</>
		);
	}

	return (
		<>
			{ editTemplateToolbar }
			{ inspector }
			<div { ...blockProps }>
				<Placeholder
					icon={ icon }
					label={ __( 'Template Content' ) }
					instructions={
						isLoaded
							? __(
									'On the frontend, this block renders whichever template the WordPress hierarchy selects (front-page, archive, single, 404, etc.).'
							  )
							: __( 'Loading template preview…' )
					}
				>
					{ ! isLoaded && <Spinner /> }
				</Placeholder>
			</div>
		</>
	);
}

export default function TemplateContentEdit( { clientId } ) {
	const blockProps = useBlockProps();

	// `__experimentalRootInnerTemplateId` is set by edit-site when wrapping
	// a non-root template inside `root.html`. When set, this block's
	// children are the inner template's blocks; when not, we're being
	// rendered inside `root.html` itself and show a non-editable preview.
	const innerTemplateId = useSelect( ( select ) => {
		return (
			select( blockEditorStore ).getSettings()
				.__experimentalRootInnerTemplateId ?? null
		);
	}, [] );

	if ( innerTemplateId ) {
		return (
			<WrapModeEdit
				innerTemplateId={ innerTemplateId }
				blockProps={ blockProps }
				clientId={ clientId }
			/>
		);
	}

	return <PreviewModeEdit blockProps={ blockProps } />;
}
