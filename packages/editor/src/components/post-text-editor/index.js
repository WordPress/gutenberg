/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { VisuallyHidden } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Displays the Post Text Editor along with content in Visual and Text mode.
 *
 * @return {React.ReactNode} The rendered PostTextEditor component.
 */
export default function PostTextEditor() {
	const instanceId = useInstanceId( PostTextEditor );
	const { value, type, id } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId, getEditedPostContent } =
			select( editorStore );
		return {
			value: getEditedPostContent(),
			type: getCurrentPostType(),
			id: getCurrentPostId(),
		};
	}, [] );
	const { editEntityRecord } = useDispatch( coreStore );

	return (
		<>
			<VisuallyHidden
				as="label"
				htmlFor={ `post-content-${ instanceId }` }
			>
				{ __( 'Type text or HTML' ) }
			</VisuallyHidden>
			<Textarea
				autoComplete="off"
				dir="auto"
				value={ value }
				onChange={ ( event ) => {
					editEntityRecord( 'postType', type, id, {
						content: event.target.value,
						blocks: undefined,
						selection: undefined,
					} );
				} }
				className="editor-post-text-editor"
				id={ `post-content-${ instanceId }` }
				placeholder={ __( 'Start writing with text or HTML' ) }
			/>
		</>
	);
}
