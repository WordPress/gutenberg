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
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
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
				onChange={ ( newWidth ) =>
					setAttributes( {
						width: newWidth,
						height: newWidth,
					} )
				}
				min={ avatar.minSize }
				max={ avatar.maxsize }
				initialPosition={ attributes?.width }
				value={ attributes?.width }
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
	const spacingProps = useSpacingProps( attributes );
	const borderProps = useBorderProps( attributes );
	return (
		<div { ...spacingProps } { ...blockProps }>
			<ResizableBox
				size={ {
					width: attributes.width,
					height: attributes.height,
				} }
				showHandle={ isSelected }
				onResizeStop={ ( event, direction, elt, delta ) => {
					setAttributes( {
						height: parseInt(
							attributes.height + delta.height,
							10
						),
						width: parseInt( attributes.width + delta.width, 10 ),
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
				<img src={ avatar.src } alt={ avatar.alt } { ...borderProps } />
			</ResizableBox>
		</div>
	);
};
const CommentEdit = ( { attributes, context, setAttributes, isSelected } ) => {
	const { commentId } = context;
	const blockProps = useBlockProps( {
		className: classnames(
			'avatar',
			`avatar-${ attributes?.width }`,
			'photo',
			'wp-avatar__image'
		),
	} );

	const avatar = (
		<ResizableAvatar
			attributes={ attributes }
			avatar={ useCommentAvatar( { commentId } ) }
			blockProps={ blockProps }
			isSelected={ isSelected }
			setAttributes={ setAttributes }
		/>
	);
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
					className="wp-avatar__link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{ avatar }
				</a>
			) : (
				avatar
			) }
		</>
	);
};

const UserEdit = ( { attributes, context, setAttributes, isSelected } ) => {
	const { postId, postType } = context;
	const blockProps = useBlockProps( {
		className: classnames(
			'avatar',
			`avatar-${ attributes.width }`,
			'photo',
			'wp-avatar__image'
		),
	} );
	const avatar = (
		<ResizableAvatar
			attributes={ attributes }
			avatar={ useUserAvatar( { postId, postType } ) }
			blockProps={ blockProps }
			isSelected={ isSelected }
			setAttributes={ setAttributes }
		/>
	);
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
						className="wp-avatar__link"
						onClick={ ( event ) => event.preventDefault() }
					>
						{ avatar }
					</a>
				) : (
					avatar
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
