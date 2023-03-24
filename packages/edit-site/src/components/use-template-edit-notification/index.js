/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

const POST_CONTENT_BLOCK_NAMES = [
	'core/post-featured-image',
	'core/post-title',
	'core/post-content',
];

export default function useTemplateEditNotification() {
	const { isPostEditFocus, isTemplateBlockSelected } = useSelect(
		( select ) => {
			const { getEditFocus } = select( editSiteStore );
			const {
				getSelectedBlockClientId,
				getBlockName,
				getBlockParents,
				getBlockNamesByClientId,
			} = select( blockEditorStore );
			const selectedClientId = getSelectedBlockClientId();
			return {
				isPostEditFocus: getEditFocus() === 'post',
				isTemplateBlockSelected:
					selectedClientId &&
					! POST_CONTENT_BLOCK_NAMES.includes(
						getBlockName( selectedClientId )
					) &&
					getBlockNamesByClientId(
						getBlockParents( selectedClientId )
					).every(
						( name ) => ! POST_CONTENT_BLOCK_NAMES.includes( name )
					),
			};
		},
		[]
	);

	const { createNotice } = useDispatch( noticesStore );
	const { setEditFocus } = useDispatch( editSiteStore );

	const shownNotification = useRef( false );

	useEffect( () => {
		if (
			isPostEditFocus &&
			isTemplateBlockSelected &&
			! shownNotification.current
		) {
			shownNotification.current = true;
			createNotice(
				'info',
				__( 'Edit your template to edit this block' ),
				{
					isDismissible: true,
					type: 'snackbar',
					actions: [
						{
							label: __( 'Edit template' ),
							onClick() {
								setEditFocus( 'template' );
							},
						},
					],
				}
			);
		}
	}, [ isPostEditFocus, isTemplateBlockSelected, createNotice ] );
}
