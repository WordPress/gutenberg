/**
 * External dependencies
 */
import classnames from 'classnames';

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
	isMenuOpen,
	menuAnchorRef,
	mediaDetails,
	isLoading,
	...props
} ) {
	return (
		<Button
			className={ classnames( 'editor-post-featured-image__preview', {
				'is-menu-open': isMenuOpen,
			} ) }
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
			{ /* TODO: If Icon supported ref then could eliminate this wrapper. */ }
			<span
				ref={ menuAnchorRef }
				className="editor-post-featured-image__preview-icon"
			>
				<Icon icon={ pencil } />
			</span>
		</Button>
	);
}
