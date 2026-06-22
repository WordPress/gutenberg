/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { Stack } from '@wordpress/ui';
import { useMemo } from '@wordpress/element';
import { useViewConfig } from '@wordpress/views';

/**
 * Internal dependencies
 */
import PostCardPanel from '../post-card-panel';
import PostPanelSection from '../post-panel-section';
import { store as editorStore } from '../../store';
import PostTrash from '../post-trash';
import usePostFields from '../post-fields';
import { usePostTemplatePanelMode } from '../post-template/hooks';
import revisionsField from '../../dataviews/fields/revisions';

const EMPTY_FORM = { layout: { type: 'panel' }, fields: [] };

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
	const { postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
		};
	}, [] );
	const { form: formConfig } = useViewConfig( {
		kind: 'postType',
		name: postType,
	} );
	const form = formConfig ?? EMPTY_FORM;
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

	// Assemble every piece of supplementary data merged into the form `data`
	// alongside the post record: read-only editor data that the post's own
	// fields consume (e.g. the `template` field's `available_templates` in
	// classic themes), and the records of other entities targeted by namespaced
	// fields (keyed by `${ kind }_${ name }`) together with the id used to
	// persist edits back to each one.
	const { entityData, entityIds, availableTemplates } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, canUser, getCurrentTheme } =
				select( coreDataStore );

			const _availableTemplates = getCurrentTheme()?.is_block_theme
				? null
				: select( editorStore ).getEditorSettings()
						.availableTemplates ?? {};

			const extra = {};
			const ids = {};

			// Other entities the current post type needs merged into its form.
			for ( const [ key, entity ] of Object.entries(
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
				extra[ key ] = getEditedEntityRecord(
					entity.kind,
					entity.name,
					id
				);
				ids[ key ] = id;
			}

			return {
				entityData: extra,
				entityIds: ids,
				availableTemplates: _availableTemplates,
			};
		},
		[ postType ]
	);

	// Merge the supplementary data onto the record only when there is any.
	const data = useMemo( () => {
		if ( ! record ) {
			return record;
		}
		const extra = { ...entityData };
		if ( availableTemplates && Object.keys( availableTemplates ).length ) {
			extra.available_templates = availableTemplates;
		}
		if ( ! Object.keys( extra ).length ) {
			return record;
		}
		return { ...record, ...extra };
	}, [ record, entityData, availableTemplates ] );

	const { editEntityRecord } = useDispatch( coreDataStore );

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
				editEntityRecord(
					entity.kind,
					entity.name,
					entityIds[ key ],
					value
				);
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
				<PostTrash onActionPerformed={ onActionPerformed } />
			</Stack>
		</PostPanelSection>
	);
}
