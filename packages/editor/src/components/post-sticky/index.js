/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostStickyCheck from './check';
import { store as editorStore } from '../../store';

/**
 * Renders the PostSticky component. It provides a checkbox control for the sticky post feature.
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
			<CheckboxControl
				className="editor-post-sticky__checkbox-control"
				label={ __( 'Sticky' ) }
				help={ __( 'Pin this post to the top of the blog' ) }
				checked={ postSticky }
				onChange={ () => editPost( { sticky: ! postSticky } ) }
				__nextHasNoMarginBottom
			/>
		</PostStickyCheck>
	);
}
