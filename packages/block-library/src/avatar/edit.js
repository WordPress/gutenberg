/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ResizableBox,
	ToggleControl,
} from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useUserAvatar, useCommentAvatar } from './hooks';
import UserControl from './user-control';

const AvatarInspectorControls = ( {
	setAttributes,
	avatar,
	attributes,
	selectUser,
} ) => (
	<InspectorControls>
		<PanelBody title={ __( 'Settings' ) }>
			<RangeControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
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
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Link to user profile' ) }
				onChange={ () =>
					setAttributes( { isLink: ! attributes.isLink } )
				}
				checked={ attributes.isLink }
			/>
			{ attributes.isLink && (
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Open in new tab' ) }
					onChange={ ( value ) =>
						setAttributes( {
							linkTarget: value ? '_blank' : '_self',
						} )
					}
					checked={ attributes.linkTarget === '_blank' }
				/>
			) }
			{ selectUser && (
				<UserControl
					value={ attributes?.userId }
					onChange={ ( value ) => {
						setAttributes( {
							userId: value,
						} );
					} }
				/>
			) }
		</PanelBody>
	</InspectorControls>
);

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
			<ResizableBox
				size={ {
					width: attributes.size,
					height: attributes.size,
				} }
				showHandle={ isSelected }
				onResizeStop={ ( event, direction, elt, delta ) => {
					setAttributes( {
						size: parseInt(
							attributes.size + ( delta.height || delta.width ),
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
		</div>
	);
};
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
			{ attributes.isLink ? (
				<a
					href="#avatar-pseudo-link"
					className="wp-block-avatar__link"
					onClick={ ( event ) => event.preventDefault() }
				>
					<ResizableAvatar
						attributes={ attributes }
						avatar={ avatar }
						blockProps={ blockProps }
						isSelected={ isSelected }
						setAttributes={ setAttributes }
					/>
				</a>
			) : (
				<ResizableAvatar
					attributes={ attributes }
					avatar={ avatar }
					blockProps={ blockProps }
					isSelected={ isSelected }
					setAttributes={ setAttributes }
				/>
			) }
		</>
	);
};

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
			{ attributes.isLink ? (
				<a
					href="#avatar-pseudo-link"
					className="wp-block-avatar__link"
					onClick={ ( event ) => event.preventDefault() }
				>
					<ResizableAvatar
						attributes={ attributes }
						avatar={ avatar }
						blockProps={ blockProps }
						isSelected={ isSelected }
						setAttributes={ setAttributes }
					/>
				</a>
			) : (
				<ResizableAvatar
					attributes={ attributes }
					avatar={ avatar }
					blockProps={ blockProps }
					isSelected={ isSelected }
					setAttributes={ setAttributes }
				/>
			) }
		</>
	);
};

export default function Edit( props ) {
	// Don't show the Comment Edit controls if we have a comment ID set, or if we're in the Site Editor (where it is `null`).
	if ( props?.context?.commentId || props?.context?.commentId === null ) {
		return <CommentEdit { ...props } />;
	}
	return <UserEdit { ...props } />;
}
