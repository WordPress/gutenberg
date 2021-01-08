/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

// Version of the file block without PR#28062 accessibility fix.
const deprecated = [
	{
		attributes: {
			id: {
				type: 'number',
			},
			href: {
				type: 'string',
			},
			fileName: {
				type: 'string',
				source: 'html',
				selector: 'a:not([download])',
			},
			textLinkHref: {
				type: 'string',
				source: 'attribute',
				selector: 'a:not([download])',
				attribute: 'href',
			},
			textLinkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'a:not([download])',
				attribute: 'target',
			},
			showDownloadButton: {
				type: 'boolean',
				default: true,
			},
			downloadButtonText: {
				type: 'string',
				source: 'html',
				selector: 'a[download]',
			},
		},
		supports: {
			align: true,
		},
		save( { attributes } ) {
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
								rel={
									textLinkTarget
										? 'noreferrer noopener'
										: false
								}
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
								<RichText.Content
									value={ downloadButtonText }
								/>
							</a>
						) }
					</div>
				)
			);
		},
	},
];

export default deprecated;
