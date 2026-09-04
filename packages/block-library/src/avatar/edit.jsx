import clsx from 'clsx';
import {
	InspectorControls,
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
} from '@wordpress/block-editor';
import {
	RangeControl,
	ResizableBox,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { useCommentAvatar, useUserAvatar } from './hooks';
import UserControl from './user-control';

/**
 * Renders the inspector controls for the `core/avatar` block.
 *
 * @param {Object}   props               React props.
 * @param {Function} props.setAttributes Callback for updating block attributes.
 * @param {Object}   props.avatar        Avatar data returned by `useCommentAvatar` or `useUserAvatar`, with the `minSize` and `maxSize` bounds of the size control.
 * @param {Object}   props.attributes    Block attributes: `size`, `isLink`, `linkTarget` and `userId`.
 * @param {boolean}  props.selectUser    Whether to render the user selection control.
 *
 * @return {React.JSX.Element} React element.
 */
const AvatarInspectorControls = ( {
	setAttributes,
	avatar,
	attributes,
	selectUser,
} ) => {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () => {
					setAttributes( {
						size: 96,
						isLink: false,
						linkTarget: '_self',
						userId: undefined,
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Image size' ) }
					isShownByDefault
					hasValue={ () => attributes?.size !== 96 }
					onDeselect={ () => setAttributes( { size: 96 } ) }
				>
					<RangeControl
						label={ __( 'Image size' ) }
						onChange={ ( newSize ) =>
							setAttributes( {
								size: newSize,
							} )
						}
						min={ avatar.minSize }
						max={ avatar.maxSize }
						initialPosition={ attributes?.size }
						value={ attributes?.size }
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Link to user profile' ) }
					isShownByDefault
					hasValue={ () => attributes?.isLink }
					onDeselect={ () => setAttributes( { isLink: false } ) }
				>
					<ToggleControl
						label={ __( 'Link to user profile' ) }
						onChange={ () =>
							setAttributes( { isLink: ! attributes.isLink } )
						}
						checked={ attributes.isLink }
					/>
				</ToolsPanelItem>
				{ attributes.isLink && (
					<ToolsPanelItem
						label={ __( 'Open in new tab' ) }
						isShownByDefault
						hasValue={ () => attributes?.linkTarget !== '_self' }
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
							checked={ attributes.linkTarget === '_blank' }
						/>
					</ToolsPanelItem>
				) }
				{ selectUser && (
					<ToolsPanelItem
						label={ __( 'User' ) }
						isShownByDefault
						hasValue={ () => !! attributes?.userId }
						onDeselect={ () =>
							setAttributes( { userId: undefined } )
						}
					>
						<UserControl
							value={ attributes?.userId }
							onChange={ ( value ) => {
								setAttributes( {
									userId: value,
								} );
							} }
						/>
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</InspectorControls>
	);
};

/**
 * Wraps the avatar image in a placeholder link when the block links to the user
 * profile. The link is inert in the editor: it points at a fragment and its
 * click handler prevents navigation.
 *
 * @param {Object}          props          React props.
 * @param {React.ReactNode} props.children Avatar image to wrap.
 * @param {boolean}         props.isLink   Whether to wrap the children in a link.
 *
 * @return {React.ReactNode} The children, wrapped in a link when `isLink` is true.
 */
const AvatarLinkWrapper = ( { children, isLink } ) =>
	isLink ? (
		<a
			href="#avatar-pseudo-link"
			className="wp-block-avatar__link"
			onClick={ ( event ) => event.preventDefault() }
		>
			{ children }
		</a>
	) : (
		children
	);

/**
 * Renders the avatar image inside a `ResizableBox` so its size can be adjusted
 * by dragging. Resizing keeps the aspect ratio and updates the `size` attribute.
 *
 * @param {Object}   props               React props.
 * @param {Function} props.setAttributes Callback for updating block attributes.
 * @param {Object}   props.attributes    Block attributes: `size` and `isLink`, plus the border support values read by `useBorderProps`.
 * @param {Object}   props.avatar        Avatar data returned by `useCommentAvatar` or `useUserAvatar`, with the image `src` and `alt` and the `minSize` and `maxSize` resize bounds.
 * @param {Object}   props.blockProps    Props returned by `useBlockProps`, applied to the wrapper element.
 * @param {boolean}  props.isSelected    Whether the block is selected. Resize handles are only shown when it is.
 *
 * @return {React.JSX.Element} React element.
 */
const ResizableAvatar = ( {
	setAttributes,
	attributes,
	avatar,
	blockProps,
	isSelected,
} ) => {
	const borderProps = useBorderProps( attributes );
	const doubledSizedSrc = addQueryArgs(
		removeQueryArgs( avatar?.src, [ 's' ] ),
		{
			s: attributes?.size * 2,
		}
	);
	return (
		<div { ...blockProps }>
			<AvatarLinkWrapper isLink={ attributes.isLink }>
				<ResizableBox
					size={ {
						width: attributes.size,
						height: attributes.size,
					} }
					showHandle={ isSelected }
					onResizeStop={ ( event, direction, elt, delta ) => {
						setAttributes( {
							size: parseInt(
								attributes.size +
									( delta.height || delta.width ),
								10
							),
						} );
					} }
					lockAspectRatio
					enable={ {
						top: false,
						right: ! isRTL(),
						bottom: true,
						left: isRTL(),
					} }
					minWidth={ avatar.minSize }
					maxWidth={ avatar.maxSize }
				>
					<img
						src={ doubledSizedSrc }
						alt={ avatar.alt }
						className={ clsx(
							'avatar',
							'avatar-' + attributes.size,
							'photo',
							'wp-block-avatar__image',
							borderProps.className
						) }
						style={ borderProps.style }
					/>
				</ResizableBox>
			</AvatarLinkWrapper>
		</div>
	);
};

/**
 * Renders the block for a comment author, resolving the avatar from the
 * `commentId` context. The user selection control is not offered here because
 * the author is determined by the comment.
 *
 * @param {Object}   props               React props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Object}   props.context       Inherited context, from which the comment ID is read.
 * @param {Function} props.setAttributes Callback for updating block attributes.
 * @param {boolean}  props.isSelected    Whether the block is selected.
 *
 * @return {React.JSX.Element} React element.
 */
const CommentEdit = ( { attributes, context, setAttributes, isSelected } ) => {
	const { commentId } = context;
	const blockProps = useBlockProps();
	const avatar = useCommentAvatar( { commentId } );
	return (
		<>
			<AvatarInspectorControls
				avatar={ avatar }
				setAttributes={ setAttributes }
				attributes={ attributes }
				selectUser={ false }
			/>
			<ResizableAvatar
				attributes={ attributes }
				avatar={ avatar }
				blockProps={ blockProps }
				isSelected={ isSelected }
				setAttributes={ setAttributes }
			/>
		</>
	);
};

/**
 * Renders the block for a user, resolving the avatar from the `userId`
 * attribute when set, and otherwise from the author of the post identified by
 * the `postType` and `postId` context.
 *
 * @param {Object}   props               React props.
 * @param {Object}   props.attributes    Block attributes, from which the `userId` is read.
 * @param {Object}   props.context       Inherited context, from which the post type and post ID are read.
 * @param {Function} props.setAttributes Callback for updating block attributes.
 * @param {boolean}  props.isSelected    Whether the block is selected.
 *
 * @return {React.JSX.Element} React element.
 */
const UserEdit = ( { attributes, context, setAttributes, isSelected } ) => {
	const { postId, postType } = context;
	const avatar = useUserAvatar( {
		userId: attributes?.userId,
		postId,
		postType,
	} );
	const blockProps = useBlockProps();
	return (
		<>
			<AvatarInspectorControls
				selectUser
				attributes={ attributes }
				avatar={ avatar }
				setAttributes={ setAttributes }
			/>

			<ResizableAvatar
				attributes={ attributes }
				avatar={ avatar }
				blockProps={ blockProps }
				isSelected={ isSelected }
				setAttributes={ setAttributes }
			/>
		</>
	);
};

/**
 * Renders the `core/avatar` block on the editor. All props are forwarded to
 * either `CommentEdit` or `UserEdit`, depending on whether the block is used
 * inside a comment.
 *
 * @param {Object}      props                     React props.
 * @param {Object}      props.attributes          Block attributes.
 * @param {Object}      props.context             Inherited context.
 * @param {number|null} [props.context.commentId] The comment ID when the block is used inside a comment. `null` in the Site Editor, where no comment is resolved but the comment variant is still rendered.
 * @param {string}      [props.context.postType]  The post type of the current post.
 * @param {number}      [props.context.postId]    The ID of the current post.
 * @param {Function}    props.setAttributes       Callback for updating block attributes.
 * @param {boolean}     props.isSelected          Whether the block is selected.
 *
 * @return {React.JSX.Element} React element.
 */
export default function Edit( props ) {
	// Don't show the Comment Edit controls if we have a comment ID set, or if we're in the Site Editor (where it is `null`).
	if ( props?.context?.commentId || props?.context?.commentId === null ) {
		return <CommentEdit { ...props } />;
	}
	return <UserEdit { ...props } />;
}
