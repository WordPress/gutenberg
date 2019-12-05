/**
 * WordPress dependencies
 */
import {
	useEntityProp,
	__experimentalUseEntitySaving,
	EntityProvider,
} from '@wordpress/core-data';
import { useMemo, useCallback } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { serializeBlocks } from '@wordpress/editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

const saveProps = [ 'content', 'status' ];
function TemplatePart() {
	const [ content, _setContent ] = useEntityProp(
		'postType',
		'wp_template_part',
		'content'
	);
	const [ status, setStatus ] = useEntityProp(
		'postType',
		'wp_template_part',
		'status'
	);
	const initialBlocks = useMemo( () => {
		if ( status !== 'publish' ) {
			// Publish if still an auto-draft.
			setStatus( 'publish' );
		}
		if ( typeof content !== 'function' ) {
			const parsedContent = parse( content );
			return parsedContent.length ? parsedContent : undefined;
		}
	}, [] );
	const [ blocks = initialBlocks, setBlocks ] = useEntityProp(
		'postType',
		'wp_template_part',
		'blocks'
	);
	const [ isDirty, isSaving, save ] = __experimentalUseEntitySaving(
		'postType',
		'wp_template_part',
		saveProps
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
	return (
		<>
			<Button
				isPrimary
				className="wp-block-template-part__save-button"
				disabled={ ! isDirty || ! content }
				isBusy={ isSaving }
				onClick={ saveContent }
			>
				{ __( 'Save' ) }
			</Button>
			<InnerBlocks value={ blocks } onChange={ setBlocks } onInput={ setContent } />
		</>
	);
}

export default function TemplatePartEdit( {
	attributes: { postId: _postId, slug, theme },
	setAttributes,
} ) {
	const postId = useSelect(
		( select ) => {
			if ( _postId ) {
				// This is already a custom template part,
				// use its CPT post.
				return (
					select( 'core' ).getEntityRecord(
						'postType',
						'wp_template_part',
						_postId
					) && _postId
				);
			}

			// This is not a custom template part,
			// load the auto-draft created from the
			// relevant file.
			const posts = select( 'core' ).getEntityRecords(
				'postType',
				'wp_template_part',
				{
					status: 'auto-draft',
					slug,
					meta: { theme },
				}
			);
			if ( posts && posts[ 0 ].id ) {
				// Set the post ID so that edits
				// persist.
				setAttributes( { postId: posts[ 0 ].id } );
				return posts[ 0 ].id;
			}
		},
		[ _postId, slug, theme ]
	);
	return postId ? (
		<EntityProvider kind="postType" type="wp_template_part" id={ postId }>
			<TemplatePart />
		</EntityProvider>
	) : null;
}
