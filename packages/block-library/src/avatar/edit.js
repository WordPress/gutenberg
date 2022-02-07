/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
} from '@wordpress/block-editor';
import { PanelBody, ResizableBox, RangeControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getUserAvatar, getCommentAvatar } from './utils';

export default function Edit( {
	attributes,
	context: { commentId, postId, postType },
	setAttributes,
	isSelected,
} ) {
	const { height, width } = attributes;

	const isComment = !! commentId;

	const blockProps = useBlockProps();
	const spacingProps = useSpacingProps( attributes );

	let avatar = getUserAvatar( {
		postId,
		postType,
		functionUseSelect: useSelect,
	} );

	if ( isComment ) {
		avatar = getCommentAvatar( {
			functionUseEntityProp: useEntityProp,
			functionUseSelect: useSelect,
			commentId,
		} );
	}

	const inspectorControls = (
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
					initialPosition={ width }
					value={ width }
				/>
			</PanelBody>
		</InspectorControls>
	);

	const resizableAvatar = (
		<ResizableBox
			size={ {
				width,
				height,
			} }
			showHandle={ isSelected }
			onResizeStop={ ( event, direction, elt, delta ) => {
				setAttributes( {
					height: parseInt( height + delta.height, 10 ),
					width: parseInt( width + delta.width, 10 ),
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

	return (
		<>
			{ inspectorControls }
			<div { ...spacingProps }>{ resizableAvatar }</div>
		</>
	);
}
