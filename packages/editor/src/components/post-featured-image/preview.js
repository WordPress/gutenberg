/**
 * WordPress dependencies
 */
import { Button, ResponsiveWrapper, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function PostFeaturedImagePreview( {
	mediaDetails,
	isLoading,
	...props
} ) {
	return (
		<Button
			className="editor-post-featured-image__preview"
			aria-label={ __( 'Edit or update the image' ) }
			{ ...props }
		>
			{ mediaDetails && (
				<ResponsiveWrapper
					naturalWidth={ mediaDetails.width }
					naturalHeight={ mediaDetails.height }
					isInline
				>
					<img src={ mediaDetails.sourceUrl } alt="" />
				</ResponsiveWrapper>
			) }
			{ isLoading && <Spinner /> }
		</Button>
	);
}
