/**
 * WordPress dependencies
 */
import {
	useEntityId,
	useEntityProp,
	__experimentalUseEntitySaving,
} from '@wordpress/core-data';
import { useMemo, useCallback } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';
import { serializeBlocks } from '@wordpress/editor';

export default function PostContentEdit() {
	const postId = useEntityId( 'postType', 'post' );
	const [ content, _setContent ] = useEntityProp( 'postType', 'post', 'content' );
	const initialBlocks = useMemo( () => {
		if ( postId && typeof content !== 'function' ) {
			const parsedContent = parse( content );
			return parsedContent.length ? parsedContent : undefined;
		}
	}, [] );
	const [ blocks = initialBlocks, setBlocks ] = useEntityProp(
		'postType',
		'post',
		'blocks'
	);
	const [ isDirty, isSaving, save ] = __experimentalUseEntitySaving(
		'postType',
		'post',
		'content'
	);
	const saveContent = useCallback( () => {
		_setContent( content( { blocks } ) );
		save();
	}, [ content, blocks ] );
	const setContent = useCallback( () => {
		_setContent( ( { blocks: blocksForSerialization = [] } ) =>
			serializeBlocks( blocksForSerialization )
		);
	}, [] );
	return postId ? (
		<>
			<Button
				isPrimary
				className="wp-block-custom-entity__save-button"
				disabled={ ! isDirty || ! content }
				isBusy={ isSaving }
				onClick={ saveContent }
			>
				{ __( 'Update' ) }
			</Button>
			<div className="entry-content">
				<InnerBlocks value={ blocks } onChange={ setBlocks } onInput={ setContent } />
			</div>
		</>
	) : (
		'Post Content Placeholder'
	);
}
