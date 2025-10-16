/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { DataForm } from '@wordpress/dataviews';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useMemo, useEffect } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [
	'title',
	'status',
	'date',
	'author',
	'discussion',
];

/**
 * Returns an array of templates for the given post type, as an array of
 * options suitable for use in a `SelectControl`.
 *
 * @param {string} postType The post type to retrieve templates for.
 *
 * @return {Array<Object>} An array of objects with `value` and `label`
 *                         properties, representing the available templates.
 */
function useTemplates( postType ) {
	return useSelect(
		( select ) => {
			const templates = select( coreDataStore ).getEntityRecords(
				'postType',
				'wp_template',
				{ per_page: -1 }
			);

			return (
				templates?.map( ( template ) => ( {
					value: template.id,
					label: template.title?.rendered || template.slug,
				} ) ) || []
			);
		},
		[ postType ]
	);
}

function PostEditForm( { postType, postId } ) {
	const ids = useMemo( () => postId.split( ',' ), [ postId ] );
	const { record, hasFinishedResolution } = useSelect(
		( select ) => {
			const args = [ 'postType', postType, ids[ 0 ] ];

			const {
				getEditedEntityRecord,
				hasFinishedResolution: hasFinished,
			} = select( coreDataStore );

			return {
				record:
					ids.length === 1 ? getEditedEntityRecord( ...args ) : null,
				hasFinishedResolution: hasFinished(
					'getEditedEntityRecord',
					args
				),
			};
		},
		[ postType, ids ]
	);
	const [ multiEdits, setMultiEdits ] = useState( {} );
	const { editEntityRecord } = useDispatch( coreDataStore );
	const { fields: _fields } = usePostFields( { postType } );

	// Fetch templates using the custom hook
	const templates = useTemplates( postType );

	const fields = useMemo(
		() =>
			_fields?.map( ( field ) => {
				if ( field.id === 'status' ) {
					return {
						...field,
						elements: field.elements.filter(
							( element ) => element.value !== 'trash'
						),
					};
				}
				return field;
			} ),
		[ _fields ]
	);

	// Define form structure
	const form = useMemo(
		() => ( {
			layout: {
				type: 'panel',
			},
			fields: [
				{
					id: 'featured_media',
					layout: {
						type: 'regular',
					},
				},
				{
					id: 'status',
					label: __( 'Status & Visibility' ),
					children: [ 'status', 'password' ],
				},
				'author',
				'date',
				'slug',
				'parent',
				{
					id: 'discussion',
					label: __( 'Discussion' ),
					children: [ 'comment_status', 'ping_status' ],
				},
				{
					label: __( 'Template' ),
					id: 'template',
					layout: {
						type: 'regular',
						labelPosition: 'side',
					},
				},
			].filter(
				( field ) =>
					ids.length === 1 ||
					fieldsWithBulkEditSupport.includes(
						typeof field === 'string' ? field : field.id
					)
			),
		} ),
		[ ids ]
	);

	// Handle changes to the form
	const onChange = ( edits ) => {
		for ( const id of ids ) {
			// Reset date if changing from future status
			if (
				edits.status &&
				edits.status !== 'future' &&
				record?.status === 'future' &&
				new Date( record.date ) > new Date()
			) {
				edits.date = null;
			}

			// Clear password for private posts
			if (
				edits.status &&
				edits.status === 'private' &&
				record.password
			) {
				edits.password = '';
			}

			// Edit the entity record
			editEntityRecord( 'postType', postType, id, edits );

			// Track multi-edit changes
			if ( ids.length > 1 ) {
				setMultiEdits( ( prev ) => ( {
					...prev,
					...edits,
				} ) );
			}
		}
	};

	// Reset multi-edits when ids change
	useEffect( () => {
		setMultiEdits( {} );
	}, [ ids ] );

	// Prepare fields with template dependency
	const fieldsWithDependency = useMemo( () => {
		return fields.map( ( field ) => {
			if ( field.id === 'template' ) {
				return {
					...field,
					Edit: ( data ) => (
						<field.Edit { ...data } templates={ templates } />
					),
				};
			}
			return field;
		} );
	}, [ fields, templates ] );

	return (
		<VStack spacing={ 4 }>
			<PostCardPanel postType={ postType } postId={ ids } />
			{ hasFinishedResolution && (
				<DataForm
					data={ ids.length === 1 ? record : multiEdits }
					fields={ fieldsWithDependency }
					form={ form }
					onChange={ onChange }
				/>
			) }
		</VStack>
	);
}

export function PostEdit( { postType, postId } ) {
	return (
		<Page
			className={ clsx( 'edit-site-post-edit', {
				'is-empty': ! postId,
			} ) }
			label={ __( 'Post Edit' ) }
		>
			{ postId && (
				<PostEditForm postType={ postType } postId={ postId } />
			) }
			{ ! postId && <p>{ __( 'Select a page to edit' ) }</p> }
		</Page>
	);
}
