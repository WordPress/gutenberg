/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, BaseControl } from '@wordpress/components';
import { useId } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Stack } from '@wordpress/ui';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Single-type featured media picker — v2 building block.
 *
 * Not used by the panel today (which shows one unified picker via
 * UnifiedFeaturedMedia). Kept for v2 when each media type may get its own
 * independent slot in the sidebar.
 *
 * @param {Object}   props
 * @param {string}   props.metaKey      Post meta key to read/write (e.g. '_featured_video_id').
 * @param {string[]} props.allowedTypes Media library filter (e.g. ['video']).
 * @param {string}   props.label        Label shown above the control and in the media modal title.
 * @param {string}   props.addLabel     Button label when no media is set.
 */
export default function FeaturedMediaPicker( {
	metaKey,
	allowedTypes,
	label,
	addLabel,
} ) {
	const instanceId = useId();
	const meta = useSelect(
		( select ) =>
			select( editorStore ).getEditedPostAttribute( 'meta' ) || {},
		[]
	);
	const mediaId = meta[ metaKey ] || 0;

	const media = useSelect(
		( select ) =>
			mediaId
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						mediaId,
						{ context: 'view' }
				  )
				: null,
		[ mediaId ]
	);

	const { editPost } = useDispatch( editorStore );
	const mediaName = media?.title?.rendered || media?.slug || label;

	return (
		<BaseControl id={ instanceId } label={ label } __nextHasNoMarginBottom>
			<div className="editor-post-featured-image">
				<MediaUploadCheck>
					<MediaUpload
						title={ label }
						onSelect={ ( selected ) =>
							editPost( {
								meta: { ...meta, [ metaKey ]: selected.id },
							} )
						}
						allowedTypes={ allowedTypes }
						render={ ( { open } ) => (
							<div className="editor-post-featured-image__container">
								<Button
									__next40pxDefaultSize
									className={
										! mediaId
											? 'editor-post-featured-image__toggle'
											: 'editor-post-featured-image__preview'
									}
									onClick={ open }
									aria-haspopup="dialog"
								>
									{ mediaId ? mediaName : addLabel }
								</Button>
								{ !! mediaId && (
									<Stack className="editor-post-featured-image__actions">
										<Button
											__next40pxDefaultSize
											className="editor-post-featured-image__action"
											onClick={ open }
											aria-haspopup="dialog"
										>
											{ __( 'Replace' ) }
										</Button>
										<Button
											__next40pxDefaultSize
											className="editor-post-featured-image__action"
											onClick={ () =>
												editPost( {
													meta: {
														...meta,
														[ metaKey ]: 0,
													},
												} )
											}
										>
											{ __( 'Remove' ) }
										</Button>
									</Stack>
								) }
							</div>
						) }
						value={ mediaId }
					/>
				</MediaUploadCheck>
			</div>
		</BaseControl>
	);
}
