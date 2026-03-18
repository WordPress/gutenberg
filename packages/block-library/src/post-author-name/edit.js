/**
 * WordPress dependencies
 */
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

/**
 * Internal dependencies
 */
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

function PostAuthorNameEdit( props ) {
	useDeprecatedTextAlign( props );
	const {
		attributes: { isLink, linkTarget },
		setAttributes,
		context: { postType, postId },
	} = props;
	const { authorName, supportsAuthor } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getUser, getPostType } =
				select( coreStore );
			const _authorId = getEditedEntityRecord(
				'postType',
				postType,
				postId
			)?.author;

			return {
				authorName: _authorId ? getUser( _authorId ) : null,
				supportsAuthor:
					getPostType( postType )?.supports?.author ?? false,
			};
		},
		[ postType, postId ]
	);

	const blockProps = useBlockProps();

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

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							isLink: false,
							linkTarget: '_self',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Link to author archive' ) }
						isShownByDefault
						hasValue={ () => isLink }
						onDeselect={ () => setAttributes( { isLink: false } ) }
					>
						<ToggleControl
							label={ __( 'Link to author archive' ) }
							onChange={ () =>
								setAttributes( { isLink: ! isLink } )
							}
							checked={ isLink }
						/>
					</ToolsPanelItem>
					{ isLink && (
						<ToolsPanelItem
							label={ __( 'Open in new tab' ) }
							isShownByDefault
							hasValue={ () => linkTarget !== '_self' }
							onDeselect={ () =>
								setAttributes( { linkTarget: '_self' } )
							}
						>
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								onChange={ ( value ) =>
									setAttributes( {
										linkTarget: value ? '_blank' : '_self',
									} )
								}
								checked={ linkTarget === '_blank' }
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>
				{ ! supportsAuthor && postType !== undefined
					? sprintf(
							// translators: %s: Name of the post type e.g: "post".
							__(
								'This post type (%s) does not support the author.'
							),
							postType
					  )
					: displayAuthor }
			</div>
		</>
	);
}

export default PostAuthorNameEdit;
