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
import { Button } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Page from '../page';
import usePostFields from '../post-fields';

function PostEditForm( { postType, postId } ) {
	const { item } = useSelect(
		( select ) => {
			return {
				item: select( coreDataStore ).getEntityRecord(
					'postType',
					postType,
					postId
				),
			};
		},
		[ postType, postId ]
	);
	const { saveEntityRecord } = useDispatch( coreDataStore );
	const { fields } = usePostFields();
	const form = {
		visibleFields: [ 'title' ],
	};
	const [ edits, setEdits ] = useState( {} );
	const itemWithEdits = useMemo( () => {
		return {
			...item,
			...edits,
		};
	}, [ item, edits ] );
	const onSubmit = ( event ) => {
		event.preventDefault();
		saveEntityRecord( 'postType', postType, itemWithEdits );
		setEdits( {} );
	};

	if ( ! item ) {
		return null;
	}

	return (
		<form onSubmit={ onSubmit }>
			<DataForm
				data={ itemWithEdits }
				fields={ fields }
				form={ form }
				onChange={ setEdits }
			/>
			<Button variant="primary" type="submit">
				{ __( 'Update' ) }
			</Button>
		</form>
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
