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

const { PostCardPanel } = unlock( editorPrivateApis );

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
	const { fields } = usePostFields();
	const form = {
		type: 'panel',
		fields: [ 'title', 'author', 'date', 'comment_status', 'status' ],
	};
	const onChange = ( edits ) => {
		for ( const id of ids ) {
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
			{ ids.length === 1 && (
				<PostCardPanel postType={ postType } postId={ ids[ 0 ] } />
			) }
			<DataForm
				data={ ids.length === 1 ? record : multiEdits }
				fields={ fields }
				form={ form }
				onChange={ onChange }
			/>
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
