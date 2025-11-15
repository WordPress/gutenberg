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
import usePatternSettings from '../page-patterns/use-pattern-settings';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [
	'title',
	'status',
	'date',
	'author',
	'discussion',
];

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
	const _fields = usePostFields( { postType } );
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
	const onChange = ( edits ) => {
		for ( const id of ids ) {
			if (
				edits.status &&
				edits.status !== 'future' &&
				record?.status === 'future' &&
				new Date( record.date ) > new Date()
			) {
				edits.date = null;
			}
			if (
				edits.status &&
				edits.status === 'private' &&
				record.password
			) {
				edits.password = '';
			}
			editEntityRecord( 'postType', postType, id, edits );
			if ( ids.length > 1 ) {
				setMultiEdits( ( prev ) => ( {
					...prev,
					...edits,
				} ) );
			}
		}
	};
	useEffect( () => {
		setMultiEdits( {} );
	}, [ ids ] );

	const { ExperimentalBlockEditorProvider } = unlock(
		blockEditorPrivateApis
	);
	const settings = usePatternSettings();

	/**
	 * The template field depends on the block editor settings.
	 * This is a workaround to ensure that the block editor settings are available.
	 * For more information, see: https://github.com/WordPress/gutenberg/issues/67521
	 */
	const fieldsWithDependency = useMemo( () => {
		return fields.map( ( field ) => {
			if ( field.id === 'template' ) {
				return {
					...field,
					Edit: ( data ) => (
						<ExperimentalBlockEditorProvider settings={ settings }>
							<field.Edit { ...data } />
						</ExperimentalBlockEditorProvider>
					),
				};
			}
			return field;
		} );
	}, [ fields, settings ] );

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
