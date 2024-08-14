/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
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
import Page from '../page';
import usePostFields from '../post-fields';
import { unlock } from '../../lock-unlock';

const { PostTitle, PostActions, PostIcon } = unlock( editorPrivateApis );

function PostEditForm( { postType, postId } ) {
	const ids = useMemo( () => postId.split( ',' ), [ postId ] );
	const { record } = useSelect(
		( select ) => {
			return {
				record:
					ids.length === 1
						? select( coreDataStore ).getEditedEntityRecord(
								'postType',
								postType,
								ids[ 0 ]
						  )
						: null,
			};
		},
		[ postType, ids ]
	);
	const [ multiEdits, setMultiEdits ] = useState( {} );
	const { editEntityRecord } = useDispatch( coreDataStore );
	const { fields: _fields } = usePostFields();
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
	const form = {
		type: 'panel',
		fields: [ 'title', 'status', 'date', 'author', 'comment_status' ],
	};
	const onChange = ( edits ) => {
		for ( const id of ids ) {
			if (
				edits.status !== 'future' &&
				record.status === 'future' &&
				new Date( record.date ) > new Date()
			) {
				edits.date = null;
			}
			if ( edits.status === 'private' && record.password ) {
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

	return (
		<VStack spacing={ 4 }>
			<DataForm
				data={ ids.length === 1 ? record : multiEdits }
				fields={ fields }
				form={ form }
				onChange={ onChange }
			/>
		</VStack>
	);
}

export function PostEdit( { postType, postId, onBack } ) {
	const ids = useMemo( () => postId.split( ',' ), [ postId ] );

	return (
		<Page
			className={ clsx( 'edit-site-post-edit', {
				'is-empty': ! postId,
			} ) }
			title={
				ids.length === 1 && (
					<PostTitle postId={ ids[ 0 ] } postType={ postType } />
				)
			}
			actions={
				ids.length === 1 && (
					<PostActions postId={ ids[ 0 ] } postType={ postType } />
				)
			}
			icon={
				ids.length === 1 && (
					<PostIcon postId={ ids[ 0 ] } postType={ postType } />
				)
			}
			onBack={ onBack }
			backLabel={ __( 'Go back to all pages' ) }
		>
			<div className="edit-site-post-edit__content">
				{ postId && (
					<PostEditForm postType={ postType } postId={ postId } />
				) }
			</div>
			{ ! postId && <p>{ __( 'Select a page to edit' ) }</p> }
		</Page>
	);
}
