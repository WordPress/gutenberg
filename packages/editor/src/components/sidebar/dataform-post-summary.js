/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { Stack } from '@wordpress/ui';
import { useMemo } from '@wordpress/element';
import { useViewConfig } from '@wordpress/views';

/**
 * Internal dependencies
 */
import PostCardPanel from '../post-card-panel';
import PluginPostStatusInfo from '../plugin-post-status-info';
import PostPanelSection from '../post-panel-section';
import { store as editorStore } from '../../store';
import PostTrash from '../post-trash';
import usePostFields from '../post-fields';
import { usePostTemplatePanelMode } from '../post-template/hooks';
import revisionsField from '../../dataviews/fields/revisions';

const EMPTY_FORM = { layout: { type: 'panel' }, fields: [] };
const VIEW_CONFIG_FIELDS = [ 'form' ];

/**
 * Bridges the legacy editor-panel visibility controls onto the DataForm summary,
 * returning the form with the hidden fields removed. The new inspector has no
 * concept of the Preferences → Panels switches or of `removeEditorPanel`, so we
 * reproduce their effect on the form.
 *
 * @param {Object} form The DataForm summary form configuration.
 * @return {Object} The form with the hidden fields removed.
 */
function useInspectorPanelVisibility( form ) {
	const {
		isPostStatusRemoved,
		featuredImageEnabled,
		excerptEnabled,
		discussionEnabled,
		pageAttributesEnabled,
	} = useSelect( ( select ) => {
		const { isEditorPanelRemoved, isEditorPanelEnabled } =
			select( editorStore );
		return {
			isPostStatusRemoved: isEditorPanelRemoved( 'post-status' ),
			featuredImageEnabled: isEditorPanelEnabled( 'featured-image' ),
			excerptEnabled: isEditorPanelEnabled( 'post-excerpt' ),
			discussionEnabled: isEditorPanelEnabled( 'discussion-panel' ),
			pageAttributesEnabled: isEditorPanelEnabled( 'page-attributes' ),
		};
	}, [] );

	const visibleForm = useMemo( () => {
		if ( ! form.fields?.length ) {
			return form;
		}
		// `featured_media`/`excerpt` are their own top-level panels and
		// `post-content-info` is always shown, so they survive. Everything else
		// belongs to the `post-status` summary panel: `discussion`/`parent` honor
		// their own switch, but every one of them is hidden while the `post-status`
		// panel is removed.
		const visibilityById = {
			featured_media: featuredImageEnabled,
			excerpt: excerptEnabled,
			'post-content-info': true,
			discussion: discussionEnabled && ! isPostStatusRemoved,
			parent: pageAttributesEnabled && ! isPostStatusRemoved,
		};
		const isFieldVisible = ( id ) =>
			id in visibilityById ? visibilityById[ id ] : ! isPostStatusRemoved;
		// Recurse into `children` so a panel-tied field is dropped wherever it
		// sits in the form: the PHP view-config filter can nest such a field
		// inside another field's group.
		const filterFields = ( fields ) =>
			fields.reduce( ( acc, field ) => {
				const id = typeof field === 'string' ? field : field.id;
				if ( ! isFieldVisible( id ) ) {
					return acc;
				}
				if (
					typeof field !== 'string' &&
					Array.isArray( field.children )
				) {
					const children = filterFields( field.children );
					// A group whose children were all removed would render as
					// an empty panel, so drop it too.
					if ( ! children.length ) {
						return acc;
					}
					acc.push( { ...field, children } );
					return acc;
				}
				acc.push( field );
				return acc;
			}, [] );
		return { ...form, fields: filterFields( form.fields ) };
	}, [
		form,
		isPostStatusRemoved,
		featuredImageEnabled,
		excerptEnabled,
		discussionEnabled,
		pageAttributesEnabled,
	] );

	return visibleForm;
}

// Some post types expose summary fields that edit entities other than the one
// being edited. Keyed by the post type that needs them, the related records are
// merged into the form data under a `${ kind }_${ name }` namespace key so that
// a single DataForm can read and write all of them, and edits to those keys are
// routed back to their entity.
//
// The fields themselves are namespace-agnostic: they read and write a plain
// record. The `fields` list ties each one to the entity it edits, and this
// component overrides their `getValue`/`setValue`/`render` to operate on the
// namespaced record, plus their `isVisible` to only show where that record is
// present (e.g. the `home`/`index` template summary).
//
// Currently only `wp_template` uses this: `posts_per_page` and
// `default_comment_status` target `root/site`, and `posts_page_title` targets
// the posts page (the `page` assigned as `page_for_posts`).
const ENTITIES = {
	wp_template: {
		root_site: {
			kind: 'root',
			name: 'site',
			fields: [ 'posts_per_page', 'default_comment_status' ],
			isVisible: ( item ) =>
				[ 'home', 'index' ].includes( item.slug ?? '' ),
		},
		posttype_page: {
			kind: 'postType',
			name: 'page',
			getId: ( select ) =>
				select( coreDataStore ).getEditedEntityRecord( 'root', 'site' )
					?.page_for_posts,
			fields: [ 'posts_page_title' ],
			isVisible: ( item ) =>
				[ 'home', 'index' ].includes( item.slug ?? '' ),
		},
	},
};

// Rebinds a namespace-agnostic field to the namespaced record it edits. Every
// field callback that receives the form `item` is redirected to the
// `item[ namespace ]` sub-record so the field operates on its own entity:
// `getValue`/`setValue`/`render` here, and the rest indirectly because they all
// funnel through the (remapped) `getValue` (default `render`, `getValueFormatted`
// and `isValid` range/`custom` validation). Edits are wrapped back under the
// namespace key. The caller-supplied `isVisible` encodes entity-specific
// conditions (e.g. only for `home`/`index` templates); the generic guard
// `!! item[ namespace ]` ensures the field is hidden when the sub-record
// hasn't been fetched.
function bindFieldToNamespace( field, namespace, isVisible = () => true ) {
	const subItem = ( item ) => item?.[ namespace ] ?? {};
	return {
		...field,
		getValue: ( { item } ) =>
			field.getValue
				? field.getValue( { item: subItem( item ) } )
				: subItem( item )[ field.id ],
		setValue: ( { item, value } ) => ( {
			[ namespace ]: field.setValue( { item: subItem( item ), value } ),
		} ),
		render: field.render
			? ( props ) =>
					field.render( { ...props, item: subItem( props.item ) } )
			: undefined,
		isVisible: ( item ) => isVisible( item ) && !! item[ namespace ],
	};
}

export default function DataFormPostSummary( { onActionPerformed } ) {
	const { postType, postId, isPostStatusRemoved, availableTemplates } =
		useSelect( ( select ) => {
			const {
				getCurrentPostType,
				getCurrentPostId,
				isEditorPanelRemoved,
				getEditorSettings,
			} = select( editorStore );
			const _availableTemplates = select(
				coreDataStore
			).getCurrentTheme()?.is_block_theme
				? null
				: getEditorSettings().availableTemplates ?? null;
			return {
				postType: getCurrentPostType(),
				postId: getCurrentPostId(),
				isPostStatusRemoved: isEditorPanelRemoved( 'post-status' ),
				availableTemplates: _availableTemplates,
			};
		}, [] );
	const { form: formConfig } = useViewConfig( {
		kind: 'postType',
		name: postType,
		fields: VIEW_CONFIG_FIELDS,
	} );
	// Bridge the legacy editor-panel visibility (Preferences → Panels and
	// programmatic panel removal) onto the form by dropping hidden fields.
	const form = useInspectorPanelVisibility( formConfig ?? EMPTY_FORM );
	const record = useSelect(
		( select ) => {
			if ( ! postType || ! postId ) {
				return null;
			}
			return select( coreDataStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
		},
		[ postType, postId ]
	);

	const templatePanelMode = usePostTemplatePanelMode();

	const entityRecords = useSelect(
		( select ) => {
			const { getEditedEntityRecord, canUser } = select( coreDataStore );

			const records = {};

			// Other entities the current post type needs merged into its form.
			for ( const [ namespace, entity ] of Object.entries(
				ENTITIES[ postType ] ?? {}
			) ) {
				if (
					! canUser( 'read', {
						kind: entity.kind,
						name: entity.name,
					} )
				) {
					continue;
				}
				const id = entity.getId ? entity.getId( select ) : undefined;
				// Entities resolved through another record need a valid id.
				if ( entity.getId && ! id ) {
					continue;
				}
				records[ namespace ] = getEditedEntityRecord(
					entity.kind,
					entity.name,
					id
				);
			}

			return records;
		},
		[ postType ]
	);

	// Merge the supplementary data onto the record.
	const data = useMemo( () => {
		if ( ! record ) {
			return record;
		}
		const extra = { ...entityRecords };
		if ( availableTemplates && Object.keys( availableTemplates ).length ) {
			extra.available_templates = availableTemplates;
		}
		return { ...record, ...extra };
	}, [ record, entityRecords, availableTemplates ] );

	const { editEntityRecord } = useDispatch( coreDataStore );
	const registry = useRegistry();

	// Map of namespaced field id to the namespace key its entity is merged under.
	const fieldNamespaces = useMemo( () => {
		const map = {};
		for ( const [ namespace, entity ] of Object.entries(
			ENTITIES[ postType ] ?? {}
		) ) {
			for ( const id of entity.fields ?? [] ) {
				map[ id ] = namespace;
			}
		}
		return map;
	}, [ postType ] );

	const _fields = usePostFields( { postType } );
	const fields = useMemo(
		() =>
			_fields
				?.map( ( field ) => {
					const namespace = fieldNamespaces[ field.id ];
					if ( namespace ) {
						return bindFieldToNamespace(
							field,
							namespace,
							ENTITIES[ postType ]?.[ namespace ]?.isVisible
						);
					}
					if ( field.id === 'status' ) {
						return {
							...field,
							elements: field.elements.filter(
								( element ) => element.value !== 'trash'
							),
						};
					}
					if ( field.id === 'template' ) {
						// `usePostTemplatePanelMode` is reused in the Post Template panel to match
						// the existing behavior. If the panel rendered nothing we should exclude the
						// template field from the form.
						if ( ! templatePanelMode ) {
							return null;
						}
						// In classic themes without available templates we need to make the field read-only.
						if (
							templatePanelMode === 'classic' &&
							Object.keys( availableTemplates ?? {} ).length === 0
						) {
							return {
								...field,
								readOnly: true,
								render: () => __( 'Default template' ),
							};
						}
						return field;
					}
					return field;
				} )
				.filter( Boolean )
				// Editor-only field, injected here rather than registered
				// so it never leaks into the site editor list / quick-edit fields.
				.concat( revisionsField ),
		[
			_fields,
			templatePanelMode,
			availableTemplates,
			fieldNamespaces,
			postType,
		]
	);

	const onChange = ( edits ) => {
		// Route edits that target another entity (merged in under a namespace)
		// back to that entity; collect the rest for the post being edited.
		const entities = ENTITIES[ postType ] ?? {};
		const baseEdits = {};
		for ( const [ key, value ] of Object.entries( edits ) ) {
			const entity = entities[ key ];
			if ( entity ) {
				// Resolve the id the same way it was resolved to read the
				// record, so the save targets the right entity regardless of
				// its key field (`undefined` for the `root/site` singleton).
				const id = entity.getId
					? entity.getId( registry.select )
					: undefined;
				editEntityRecord( entity.kind, entity.name, id, value );
			} else {
				baseEdits[ key ] = value;
			}
		}

		if ( ! Object.keys( baseEdits ).length ) {
			return;
		}

		if (
			baseEdits.status &&
			baseEdits.status !== 'future' &&
			record?.status === 'future' &&
			new Date( record.date ) > new Date()
		) {
			baseEdits.date = null;
		}
		if (
			baseEdits.status &&
			baseEdits.status === 'private' &&
			record?.password
		) {
			baseEdits.password = '';
		}

		editEntityRecord( 'postType', postType, postId, baseEdits );
	};
	return (
		<PostPanelSection className="editor-post-summary">
			<Stack direction="column" gap="lg">
				<PostCardPanel
					postType={ postType }
					postId={ postId }
					onActionPerformed={ onActionPerformed }
				/>
				<DataForm
					data={ data }
					fields={ fields }
					form={ form }
					onChange={ onChange }
				/>
				{ ! isPostStatusRemoved && (
					<>
						<PluginPostStatusInfo.Slot>
							{ ( fills ) =>
								fills.length > 0 && (
									<Stack direction="column" gap="xs">
										{ fills }
									</Stack>
								)
							}
						</PluginPostStatusInfo.Slot>
						<PostTrash onActionPerformed={ onActionPerformed } />
					</>
				) }
			</Stack>
		</PostPanelSection>
	);
}
