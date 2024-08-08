/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DataForm, isItemValid } from '@wordpress/dataviews';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import {
	Button,
	FlexItem,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Page from '../page';
import usePostFields from '../post-fields';

function PostEditForm( { postType, postId } ) {
	const ids = useMemo( () => postId.split( ',' ), [ postId ] );
	const { initialEdits } = useSelect(
		( select ) => {
			if ( ids.length !== 1 ) {
			}
			return {
				initialEdits:
					ids.length === 1
						? select( coreDataStore ).getEntityRecord(
								'postType',
								postType,
								ids[ 0 ]
						  )
						: null,
			};
		},
		[ postType, ids ]
	);
	const registry = useRegistry();
	const { saveEntityRecord } = useDispatch( coreDataStore );
	const { fields } = usePostFields();
	const form = {
		type: 'panel',
		fields: [ 'title', 'author' ],
	};
	const [ edits, setEdits ] = useState( {} );
	const itemWithEdits = useMemo( () => {
		return {
			...initialEdits,
			...edits,
		};
	}, [ initialEdits, edits ] );
	const onSubmit = async ( event ) => {
		event.preventDefault();

		if ( ! isItemValid( itemWithEdits, fields, form ) ) {
			return;
		}

		const { getEntityRecord } = registry.resolveSelect( coreDataStore );
		for ( const id of ids ) {
			const item = await getEntityRecord( 'postType', postType, id );
			saveEntityRecord( 'postType', postType, {
				...item,
				...edits,
			} );
		}
		setEdits( {} );
	};

	const isUpdateDisabled = ! isItemValid( itemWithEdits, fields, form );
	return (
		<VStack as="form" onSubmit={ onSubmit } spacing={ 4 }>
			<DataForm
				data={ itemWithEdits }
				fields={ fields }
				form={ form }
				onChange={ setEdits }
			/>
			<FlexItem>
				<Button
					variant="primary"
					type="submit"
					accessibleWhenDisabled
					disabled={ isUpdateDisabled }
					__next40pxDefaultSize
				>
					{ __( 'Update' ) }
				</Button>
			</FlexItem>
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
