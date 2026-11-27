import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import type { Comment, User } from '@wordpress/core-data';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import type { BlockEditProps } from '@wordpress/blocks';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';
import type {
	CommentAuthorNameAttributes,
	CommentAuthorNameBlockContext,
} from './types';

/**
 * Renders the `core/comment-author-name` block on the editor.
 *
 * @param props React props.
 *
 * @return React element.
 */
export default function Edit(
	props: BlockEditProps< CommentAuthorNameAttributes > & {
		context: CommentAuthorNameBlockContext;
	}
) {
	const {
		attributes: { isLink, linkTarget },
		context: { commentId },
		setAttributes,
	} = props;
	useDeprecatedTextAlign( props );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const blockProps = useBlockProps();
	let displayName = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );

			const comment = getEntityRecord< Comment >(
				'root',
				'comment',
				commentId
			);
			const authorName = comment?.author_name;

			if ( comment && ! authorName ) {
				const user = getEntityRecord< User >(
					'root',
					'user',
					comment.author
				);
				return user?.name ?? __( 'Anonymous' );
			}
			return authorName ?? '';
		},
		[ commentId ]
	);

	const inspectorControls = (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () => {
					setAttributes( {
						isLink: true,
						linkTarget: '_self',
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Link to authors URL' ) }
					isShownByDefault
					hasValue={ () => ! isLink }
					onDeselect={ () =>
						setAttributes( {
							isLink: true,
						} )
					}
				>
					<ToggleControl
						label={ __( 'Link to authors URL' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
				</ToolsPanelItem>
				{ isLink && (
					<ToolsPanelItem
						label={ __( 'Open in new tab' ) }
						isShownByDefault
						hasValue={ () => linkTarget !== '_self' }
						onDeselect={ () =>
							setAttributes( {
								linkTarget: '_self',
							} )
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
	);

	if ( ! commentId || ! displayName ) {
		displayName = _x( 'Comment Author', 'block title' );
	}

	const displayAuthor = isLink ? (
		<a
			href="#comment-author-pseudo-link"
			onClick={ ( event ) => event.preventDefault() }
		>
			{ displayName }
		</a>
	) : (
		displayName
	);
	return (
		<>
			{ inspectorControls }
			<div { ...blockProps }>{ displayAuthor }</div>
		</>
	);
}
