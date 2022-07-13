/**
 * WordPress dependencies
 */
import {
	Button,
	ResponsiveWrapper,
	Spinner,
	Icon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';

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
			<Icon
				className="editor-post-featured-image__preview-icon"
				icon={ pencil }
			/>
		</Button>
	);
}
