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

function PostAuthorBiographyEdit( {
	attributes: { textAlign },
	setAttributes,
} ) {
	const { authorDetails } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalArchiveDescription } = getSettings();
		return {
			authorDetails: __experimentalArchiveDescription,
		};
	} );

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const displayAuthorBiography = authorDetails || __( 'Author Biography' );

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
