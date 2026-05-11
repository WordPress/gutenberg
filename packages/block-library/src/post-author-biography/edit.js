/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

function PostAuthorBiographyEdit( props ) {
	useDeprecatedTextAlign( props );
	const {
		context: { postType, postId },
	} = props;
	const { authorDetails } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getUser } = select( coreStore );
			const _authorId = getEditedEntityRecord(
				'postType',
				postType,
				postId
			)?.author;

			return {
				authorDetails: _authorId ? getUser( _authorId ) : null,
			};
		},
		[ postType, postId ]
	);

	const blockProps = useBlockProps();

	const displayAuthorBiography =
		authorDetails?.description || __( 'Author Biography' );

	return (
		<>
			<div
				{ ...blockProps }
				dangerouslySetInnerHTML={ { __html: displayAuthorBiography } }
			/>
		</>
	);
}

export default PostAuthorBiographyEdit;
