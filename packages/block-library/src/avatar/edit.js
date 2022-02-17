/**
 * External dependencies
 */
import classnames from 'classnames';

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

/**
 * Internal dependencies
 */
import { useUserAvatar, useCommentAvatar } from './hooks';

const AvatarInspectorControls = ( { setAttributes, avatar, attributes } ) => (
	<InspectorControls>
		<PanelBody title={ __( 'Avatar Settings' ) }>
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
			<ToggleControl
				label={ __( 'Link to user profile' ) }
				onChange={ () =>
					setAttributes( { isLink: ! attributes.isLink } )
				}
				checked={ attributes.isLink }
			/>
			{ attributes.isLink && (
				<ToggleControl
					label={ __( 'Open in new tab' ) }
					onChange={ ( value ) =>
						setAttributes( {
							linkTarget: value ? '_blank' : '_self',
						} )
					}
					checked={ attributes.linkTarget === '_blank' }
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
					src={ avatar.src }
					alt={ avatar.alt }
					{ ...borderProps }
					className={ classnames(
						'avatar',
						'avatar-' + attributes.size,
						'photo',
						'wp-block-avatar__image',
						borderProps.className
					) }
					style={ {
						...borderProps.style, // Border radius, width and style.
					} }
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
	const blockProps = useBlockProps();
	const avatar = useUserAvatar( { postId, postType } );
	return (
		<>
			<AvatarInspectorControls
				attributes={ attributes }
				avatar={ avatar }
				setAttributes={ setAttributes }
			/>
			<div>
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
			</div>
		</>
	);
};

export default function Edit( props ) {
	// I would like to not call useCommentAvatar API requests if there is no commentId
	// but is not recommended having conditional hook. Any ideas?
	if ( props?.context?.commentId ) {
		return <CommentEdit { ...props } />;
	}
	return <UserEdit { ...props } />;
}
