/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		href,
		fileName,
		textLinkHref,
		textLinkTarget,
		showDownloadButton,
		downloadButtonText,
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
						<RichText.Content value={ downloadButtonText } />
					</a>
				) }
			</div>
		)
	);
}
