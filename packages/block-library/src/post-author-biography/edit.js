/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

function PostAuthorBiographyEdit( {
	context: { postType, postId },
	attributes: { textAlign },
	setAttributes,
} ) {
	const { authorBiography } = useSelect(
		( select ) => {
			let authorDetails;
			let biography;
			if ( postType && postId ) {
				const { getEditedEntityRecord, getUser } = select( coreStore );
				const _authorId = getEditedEntityRecord(
					'postType',
					postType,
					postId
				)?.author;
				authorDetails = _authorId ? getUser( _authorId ) : null;
				biography = authorDetails?.description;
			} else {
				const { getSettings } = select( blockEditorStore );
				const { __experimentalArchiveDescription } = getSettings();
				biography = __experimentalArchiveDescription;
			}
			return {
				authorBiography: biography,
			};
		},
		[ postType, postId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const displayAuthorBiography = authorBiography || __( 'Author Biography' );

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<div
				{ ...blockProps }
				dangerouslySetInnerHTML={ { __html: displayAuthorBiography } }
			/>
		</>
	);
}

export default PostAuthorBiographyEdit;
