/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { PanelBody, ToggleControl } from '@wordpress/components';

/**
 * Renders the `core/post-comment-author` block on the editor.
 *
 * @param {Object} props               React props.
 * @param {Object} props.setAttributes Callback for updating block attributes.
 * @param {Object} props.attributes    Block attributes.
 * @param {Object} props.context       Inherited context.
 *
 * @return {JSX.Element} React element.
 */
export default function Edit( { attributes, context, setAttributes } ) {
	const { className, isLink, linkTarget } = attributes;
	const { commentId } = context;
	const blockProps = useBlockProps( { className } );

	const displayName = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );

			const comment = getEntityRecord( 'root', 'comment', commentId );
			const authorName = comment?.author_name; // eslint-disable-line camelcase

			if ( comment && ! authorName ) {
				const user = getEntityRecord( 'root', 'user', comment.author );
				return user?.name ?? __( 'Anonymous' );
			}
			return authorName ?? '';
		},
		[ commentId ]
	);

	const displayAuthor = isLink ? (
		<a
			href="#comment-author-pseudo-link"
			onClick={ ( event ) => event.preventDefault() }
		>
			{ displayName }
		</a>
	) : (
		<p>{ displayName }</p>
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Link to authors URL' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					{ isLink && (
						<ToggleControl
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
			<div { ...blockProps }>{ displayAuthor }</div>
		</>
	);
}
