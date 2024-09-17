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
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { PanelBody, ToggleControl } from '@wordpress/components';

function PostAuthorNameEdit( {
	context: { postType, postId },
	attributes: { textAlign, isLink, linkTarget },
	setAttributes,
} ) {
	const { authorName } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getUser } = select( coreStore );
			const _authorId = getEditedEntityRecord(
				'postType',
				postType,
				postId
			)?.author;

			return {
				authorName: _authorId ? getUser( _authorId ) : null,
			};
		},
		[ postType, postId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const displayName = authorName?.name || __( 'Author Name' );

	const displayAuthor = isLink ? (
		<a
			href="#author-pseudo-link"
			onClick={ ( event ) => event.preventDefault() }
			className="wp-block-post-author-name__link"
		>
			{ displayName }
		</a>
	) : (
		displayName
	);

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
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Link to author archive' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					{ isLink && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Open in new tab' ) }
							onChange={ ( value ) =>
								setAttributes( {
									linkTarget: value ? '_blank' : '_self',
								} )
							}
							checked={ linkTarget === '_blank' }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }> { displayAuthor } </div>
		</>
	);
}

export default PostAuthorNameEdit;
