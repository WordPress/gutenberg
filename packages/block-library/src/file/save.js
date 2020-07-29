/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

export default function save( { attributes } ) {
	const {
		href,
		fileName,
		textLinkHref,
		textLinkTarget,
		showDownloadButton,
		downloadButtonText,
		showInlineEmbed,
		embedId,
		embedHeight,
	} = attributes;

	return (
		href && (
			<div>
				{ showInlineEmbed && (
					<>
						<object
							className="wp-block-file__embed"
							id={ `wp-block-file__embed-${ embedId }` }
							data={ href }
							type="application/pdf"
							style={ {
								width: '100%',
								height: `${ embedHeight }px`,
							} }
							aria-label={ sprintf(
								/* translators: Placeholder is the filename. */
								__( 'Embed of %s.' ),
								fileName
							) }
						/>
					</>
				) }
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
