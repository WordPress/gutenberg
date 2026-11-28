import {
	InspectorControls,
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, ResizableBox, RangeControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import type { BlockEditProps } from '@wordpress/blocks';
import type {
	CommentAuthorAvatarAttributes,
	CommentAuthorAvatarBlockContext,
} from './types';

export default function Edit( {
	attributes,
	context: { commentId },
	setAttributes,
	isSelected,
}: BlockEditProps< CommentAuthorAvatarAttributes > & {
	context: CommentAuthorAvatarBlockContext;
} ) {
	const { height, width } = attributes;

	const [ avatars ] = useEntityProp< Record< string, string > >(
		'root',
		'comment',
		'author_avatar_urls',
		commentId
	);

	const [ authorName ] = useEntityProp< string >(
		'root',
		'comment',
		'author_name',
		commentId
	);
	const avatarUrls = avatars ? Object.values( avatars ) : null;
	const sizes = avatars ? Object.keys( avatars ) : null;
	const minSize = sizes ? ( sizes[ 0 ] as unknown as number ) : 24;
	const maxSize = sizes
		? ( sizes[ sizes.length - 1 ] as unknown as number )
		: 96;
	const blockProps = useBlockProps();
	const spacingProps = useSpacingProps( attributes );
	const maxSizeBuffer = Math.floor( maxSize * 2.5 );
	const avatarURL = useSelect( ( select ) => {
		const { __experimentalDiscussionSettings } =
			select( blockEditorStore ).getSettings();

		return (
			__experimentalDiscussionSettings as
				{ avatarURL?: string } | undefined
		 )?.avatarURL;
	}, [] );

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<RangeControl
					label={ __( 'Image size' ) }
					onChange={ ( newWidth ) =>
						setAttributes( {
							width: newWidth,
							height: newWidth,
						} )
					}
					min={ minSize }
					max={ maxSizeBuffer }
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
					height: parseInt( String( height + delta.height ), 10 ),
					width: parseInt( String( width + delta.width ), 10 ),
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
			maxWidth={ maxSizeBuffer }
		>
			<img
				src={
					avatarUrls ? avatarUrls[ avatarUrls.length - 1 ] : avatarURL
				}
				alt={ `${ authorName } ${ __( 'Avatar' ) }` }
				{ ...blockProps }
			/>
		</ResizableBox>
	);

	return (
		<>
			{ inspectorControls }
			<div { ...spacingProps }>{ resizableAvatar }</div>
		</>
	);
}
