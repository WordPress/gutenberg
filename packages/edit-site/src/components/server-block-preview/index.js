/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function ServerBlockPreview( props ) {
	const { blocks } = props;
	const [ containerResizeListener, { width: containerWidth } ] =
		useResizeObserver();

	const [ html, setHTML ] = useState( '' );

	const { editedPostId } = useSelect( ( select ) => {
		const { getEditedPostId } = select( editSiteStore );
		return {
			editedPostId: getEditedPostId(),
		};
	}, [] );

	useEffect( () => {
		const getHTML = async () => {
			const dataHTML = await apiFetch( {
				path: '/wp/v2/render_blocks',
				method: 'POST',
				data: {
					blocks: serialize( blocks ),
					post_id: editedPostId,
				},
			} );
			setHTML( dataHTML );
		};
		getHTML().catch( ( error ) => {
			return error;
		} );
	}, [ blocks ] );

	return (
		<>
			<div style={ { position: 'relative', width: '100%', height: 0 } }>
				{ containerResizeListener }
			</div>
			<div className="block-editor-block-preview__container">
				{ !! containerWidth && (
					<div
						dangerouslySetInnerHTML={ {
							__html: html,
						} }
					/>
				) }
			</div>
		</>
	);
}
