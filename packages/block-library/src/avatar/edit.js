/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
} from '@wordpress/block-editor';
import { PanelBody, ResizableBox, RangeControl } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useUserAvatar, useCommentAvatar } from './utils';

const renderInspectorControls = ( { setAttributes, avatar, attributes } ) => (
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
		</PanelBody>
	</InspectorControls>
);

const renderAvatar = ( {
	setAttributes,
	attributes,
	avatar,
	blockProps,
	isSelected,
} ) => (
	<ResizableBox
		size={ {
			width: attributes.width,
			height: attributes.height,
		} }
		showHandle={ isSelected }
		onResizeStop={ ( event, direction, elt, delta ) => {
			setAttributes( {
				height: parseInt( attributes.height + delta.height, 10 ),
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
		<img src={ avatar.src } alt={ avatar.alt } { ...blockProps } />
	</ResizableBox>
);

export default function Edit( {
	attributes,
	context: { commentId, postId, postType },
	setAttributes,
	isSelected,
} ) {
	const blockProps = useBlockProps();
	const spacingProps = useSpacingProps( attributes );

	// I would like to not call useCommentAvatar API requests if there is no commentId
	// but is not recommended having conditional hook. Any ideas?
	const commentAvatar = useCommentAvatar( { commentId } );
	const userAvatar = useUserAvatar( { postId, postType } );

	return (
		<>
			{ renderInspectorControls( {
				setAttributes,
				attributes,
				avatar: commentId ? commentAvatar : userAvatar,
				isSelected,
			} ) }
			<div { ...spacingProps }>
				{ renderAvatar( {
					setAttributes,
					attributes,
					avatar: commentId ? commentAvatar : userAvatar,
					blockProps,
				} ) }
			</div>
		</>
	);
}
