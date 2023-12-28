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
				__nextHasNoMarginBottom
				label={ __( 'Stick to the top of the blog' ) }
				checked={ postSticky }
				onChange={ () => editPost( { sticky: ! postSticky } ) }
			/>
		</PostStickyCheck>
	);
}
