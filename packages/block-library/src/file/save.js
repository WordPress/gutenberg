/**
 * WordPress dependencies
 */
import { RichText, InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		href,
		fileName,
		textLinkHref,
		textLinkTarget,
		showDownloadButton,
	} = attributes;

	return (
		href && (
			<div>
				{ ! RichText.isEmpty( fileName ) && (
					<a
						href={ textLinkHref }
						target={ textLinkTarget }
						rel={ textLinkTarget ? 'noreferrer noopener' : false }
					>
						<RichText.Content value={ fileName } />
					</a>
				) }
				{ showDownloadButton && (
					<a
						href={ href }
						className="wp-block-file__button"
						download={ true }
					>
						<InnerBlocks.Content />
					</a>
				) }
			</div>
		)
	);
}
