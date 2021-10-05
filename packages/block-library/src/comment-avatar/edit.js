/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalImageSizeControl as ImageSizeControl,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, ResizableBox } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { __, isRTL } from '@wordpress/i18n';

export default ( { attributes, context: { commentId }, setAttributes } ) => {
	const { className, style, height, width } = attributes;

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

	const avatarUrls = avatars ? Object.values( avatars ) : null;
	const sizes = avatars ? Object.keys( avatars ) : null;
	const maxSize = sizes ? sizes[ sizes.length - 1 ] : null;
	const borderProps = useBorderProps( attributes );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Comment Avatar Settings' ) }>
					<ImageSizeControl
						onChange={ ( value ) => setAttributes( value ) }
						width={ width }
						height={ height }
						imageWidth={ maxSize }
						imageHeight={ maxSize }
						showPresets={ false }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
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
							right: isRTL() ? false : true,
							bottom: true,
							left: isRTL() ? true : false,
						} }
					>
						<img
							className={ classnames(
								className,
								borderProps.className,
								{
									// For backwards compatibility add style that isn't
									// provided via block support.
									'no-border-radius':
										style?.border?.radius === 0,
								}
							) }
							style={ {
								...borderProps.style,
							} }
							src={ avatarUrls[ avatarUrls.length - 1 ] }
							alt={ `${ authorName } ${ __( 'Avatar' ) }` }
						/>
					</ResizableBox>
				) : null }
			</div>
		</>
	);
};
