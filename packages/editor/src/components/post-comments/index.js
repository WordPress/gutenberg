/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RadioControl,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const COMMENT_OPTIONS = [
	{
		label: (
			<>
				{ __( 'Open' ) }
				<Text variant="muted" size={ 12 }>
					{ __( 'Visitors can add new comments and replies.' ) }
				</Text>
			</>
		),
		value: 'open',
	},
	{
		label: (
			<>
				{ __( 'Closed' ) }
				<Text variant="muted" size={ 12 }>
					{ __( 'Visitors cannot add new comments or replies.' ) }
				</Text>
				<Text variant="muted" size={ 12 }>
					{ __( 'Existing comments remain visible.' ) }
				</Text>
			</>
		),
		value: 'closed',
	},
];

function PostComments() {
	const commentStatus = useSelect(
		( select ) =>
			select( editorStore ).getEditedPostAttribute( 'comment_status' ) ??
			'open',
		[]
	);
	const { editPost } = useDispatch( editorStore );
	const handleStatus = ( newCommentStatus ) =>
		editPost( {
			comment_status: newCommentStatus,
		} );

	return (
		<form>
			<VStack spacing={ 4 }>
				<RadioControl
					className="editor-change-status__options"
					hideLabelFromVision
					label={ __( 'Comment status' ) }
					options={ COMMENT_OPTIONS }
					onChange={ handleStatus }
					selected={ commentStatus }
				/>
			</VStack>
		</form>
	);
}

/**
 * A form for managing comment status.
 *
 * @return {JSX.Element} The rendered PostComments component.
 */
export default PostComments;
