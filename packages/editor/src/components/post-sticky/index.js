/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl, VisuallyHidden } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostStickyCheck from './check';
import { store as editorStore } from '../../store';
import PostPanelRow from '../post-panel-row';

/**
 * Renders the PostSticky component. It provide toggle control for the sticky post feature.
 *
 * @return {Component} The component to be rendered.
 */
export default function PostSticky() {
	const postSticky = useSelect( ( select ) => {
		return (
			select( editorStore ).getEditedPostAttribute( 'sticky' ) ?? false
		);
	}, [] );
	const { editPost } = useDispatch( editorStore );

	return (
		<PostStickyCheck>
			<PostPanelRow label={ __( 'Sticky' ) }>
				<ToggleControl
					className="editor-post-sticky__toggle-control"
					label={
						<VisuallyHidden>{ __( 'Sticky' ) }</VisuallyHidden>
					}
					checked={ postSticky }
					onChange={ () => editPost( { sticky: ! postSticky } ) }
				/>
			</PostPanelRow>
		</PostStickyCheck>
	);
}
