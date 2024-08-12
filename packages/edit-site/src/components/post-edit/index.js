/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { DataForm } from '@wordpress/dataviews';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexBlock,
	Button,
} from '@wordpress/components';
import { useState, useMemo, useEffect } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Page from '../page';
import usePostFields from '../post-fields';
import { unlock } from '../../lock-unlock';

const { PostCardPanel } = unlock( editorPrivateApis );

function PostEditForm( { postType, postId, onBack } ) {
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
			<HStack justify="flex-start">
				{ onBack && (
					<Button
						icon={ isRTL() ? chevronRight : chevronLeft }
						onClick={ onBack }
						label={ __( 'Go back to post list' ) }
					/>
				) }
				{ ids.length === 1 && (
					<FlexBlock>
						<PostCardPanel
							postType={ postType }
							postId={ ids[ 0 ] }
						/>
					</FlexBlock>
				) }
			</HStack>
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
	return (
		<Page
			className={ clsx( 'edit-site-post-edit', {
				'is-empty': ! postId,
			} ) }
			label={ __( 'Post Edit' ) }
		>
			{ postId && (
				<PostEditForm
					postType={ postType }
					postId={ postId }
					onBack={ onBack }
				/>
			) }
			{ ! postId && <p>{ __( 'Select a page to edit' ) }</p> }
		</Page>
	);
}
