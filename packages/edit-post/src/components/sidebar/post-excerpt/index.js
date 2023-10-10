/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import {
	PostExcerpt as PostExcerptForm,
	PostExcerptCheck,
} from '@wordpress/editor';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-excerpt';

export default function PostExcerpt() {
	const { isOpened, isRemoved, isEnabled } = useSelect( ( select ) => {
		const {
			isEditorPanelRemoved,
			isEditorPanelOpened,
			isEditorPanelEnabled,
		} = select( editPostStore );

		return {
			isRemoved: isEditorPanelRemoved( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
		};
	}, [] );

	const { toggleEditorPanelOpened } = useDispatch( editPostStore );
	const toggleExcerptPanel = () => toggleEditorPanelOpened( PANEL_NAME );

	if ( isRemoved ) {
		return null;
	}

	if ( ! isEnabled ) {
		return null;
	}

	return (
		<PostExcerptCheck>
			<PanelBody
				title={ __( 'Excerpt' ) }
				opened={ isOpened }
				onToggle={ toggleExcerptPanel }
			>
				<PostExcerptForm />
			</PanelBody>
		</PostExcerptCheck>
	);
}
