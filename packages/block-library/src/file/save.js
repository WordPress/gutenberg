/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		id,
		href,
		fileName,
		textLinkHref,
		textLinkTarget,
		showDownloadButton,
		downloadButtonText,
	} = attributes;

	const fileId = `wp-block-file--media-${ id }`;

	return (
		href && (
			<div>
				{ ! RichText.isEmpty( fileName ) && (
					<a
						id={ fileId }
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
						aria-describedby={ fileId }
					>
						<RichText.Content value={ downloadButtonText } />
					</a>
				) }
			</div>
		)
	);
}
