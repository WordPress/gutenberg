/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, ResizableBox, RangeControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { __, isRTL } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useClientWidth from '../image/use-client-width';

export default function Edit( {
	attributes,
	context: { commentId },
	setAttributes,
} ) {
	const { height, width } = attributes;

	const [ avatars ] = useEntityProp(
		'root',
		'comment',
		'author_avatar_urls',
		commentId
	);

	const [ authorName ] = useEntityProp(
		'root',
		'comment',
		'author_name',
		commentId
	);
	const containerRef = useRef();
	const clientWidth = useClientWidth( containerRef );
	const avatarUrls = avatars ? Object.values( avatars ) : null;
	const sizes = avatars ? Object.keys( avatars ) : null;
	const minSize = sizes ? sizes[ 0 ] : 24;
	const maxSize = sizes ? sizes[ sizes.length - 1 ] : 96;
	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Comment Author Avatar Settings' ) }>
					<RangeControl
						label={ __( 'Image size' ) }
						onChange={ ( newWidth ) =>
							setAttributes( {
								width: newWidth,
								height: newWidth,
							} )
						}
						min={ minSize }
						max={ clientWidth || maxSize }
						initialPosition={ width }
						value={ width }
					/>
				</PanelBody>
			</InspectorControls>
			<div ref={ containerRef }>
				{ avatarUrls ? (
					<ResizableBox
						size={ {
							width,
							height,
						} }
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
						minWidth={ minSize }
						maxWidth={ clientWidth || maxSize }
					>
						<img
							src={ avatarUrls[ avatarUrls.length - 1 ] }
							alt={ `${ authorName } ${ __( 'Avatar' ) }` }
							{ ...blockProps }
						/>
					</ResizableBox>
				) : null }
			</div>
		</>
	);
}
