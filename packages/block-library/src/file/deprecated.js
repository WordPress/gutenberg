/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalGetElementClassName,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

// Version of the file block without PR#43050 removing the translated aria-label.
const v3 = {
	attributes: {
		id: {
			type: 'number',
		},
		href: {
			type: 'string',
		},
		fileId: {
			type: 'string',
			source: 'attribute',
			selector: 'a:not([download])',
			attribute: 'id',
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
		displayPreview: {
			type: 'boolean',
		},
		previewHeight: {
			type: 'number',
			default: 600,
		},
	},
	supports: {
		anchor: true,
		align: true,
	},
	save( { attributes } ) {
		const {
			href,
			fileId,
			fileName,
			textLinkHref,
			textLinkTarget,
			showDownloadButton,
			downloadButtonText,
			displayPreview,
			previewHeight,
		} = attributes;

		const pdfEmbedLabel = RichText.isEmpty( fileName )
			? __( 'PDF embed' )
			: sprintf(
					/* translators: %s: filename. */
					__( 'Embed of %s.' ),
					fileName
			  );

		const hasFilename = ! RichText.isEmpty( fileName );

		// Only output an `aria-describedby` when the element it's referring to is
		// actually rendered.
		const describedById = hasFilename ? fileId : undefined;

		return (
			href && (
				<div { ...useBlockProps.save() }>
					{ displayPreview && (
						<>
							<object
								className="wp-block-file__embed"
								data={ href }
								type="application/pdf"
								style={ {
									width: '100%',
									height: `${ previewHeight }px`,
								} }
								aria-label={ pdfEmbedLabel }
							/>
						</>
					) }
					{ hasFilename && (
						<a
							id={ describedById }
							href={ textLinkHref }
							target={ textLinkTarget }
							rel={
								textLinkTarget
									? 'noreferrer noopener'
									: undefined
							}
						>
							<RichText.Content value={ fileName } />
						</a>
					) }
					{ showDownloadButton && (
						<a
							href={ href }
							className={ classnames(
								'wp-block-file__button',
								__experimentalGetElementClassName( 'button' )
							) }
							download={ true }
							aria-describedby={ describedById }
						>
							<RichText.Content value={ downloadButtonText } />
						</a>
					) }
				</div>
			)
		);
	},
};

// In #41239 the button was made an element button which added a `wp-element-button` classname
// to the download link element.
const v2 = {
	attributes: {
		id: {
			type: 'number',
		},
		href: {
			type: 'string',
		},
		fileId: {
			type: 'string',
			source: 'attribute',
			selector: 'a:not([download])',
			attribute: 'id',
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
		displayPreview: {
			type: 'boolean',
		},
		previewHeight: {
			type: 'number',
			default: 600,
		},
	},
	supports: {
		anchor: true,
		align: true,
	},
	save( { attributes } ) {
		const {
			href,
			fileId,
			fileName,
			textLinkHref,
			textLinkTarget,
			showDownloadButton,
			downloadButtonText,
			displayPreview,
			previewHeight,
		} = attributes;

		const pdfEmbedLabel = RichText.isEmpty( fileName )
			? __( 'PDF embed' )
			: sprintf(
					/* translators: %s: filename. */
					__( 'Embed of %s.' ),
					fileName
			  );

		const hasFilename = ! RichText.isEmpty( fileName );

		// Only output an `aria-describedby` when the element it's referring to is
		// actually rendered.
		const describedById = hasFilename ? fileId : undefined;

		return (
			href && (
				<div { ...useBlockProps.save() }>
					{ displayPreview && (
						<>
							<object
								className="wp-block-file__embed"
								data={ href }
								type="application/pdf"
								style={ {
									width: '100%',
									height: `${ previewHeight }px`,
								} }
								aria-label={ pdfEmbedLabel }
							/>
						</>
					) }
					{ hasFilename && (
						<a
							id={ describedById }
							href={ textLinkHref }
							target={ textLinkTarget }
							rel={
								textLinkTarget
									? 'noreferrer noopener'
									: undefined
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
							aria-describedby={ describedById }
						>
							<RichText.Content value={ downloadButtonText } />
						</a>
					) }
				</div>
			)
		);
	},
};

// Version of the file block without PR#28062 accessibility fix.
const v1 = {
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
		displayPreview: {
			type: 'boolean',
		},
		previewHeight: {
			type: 'number',
			default: 600,
		},
	},
	supports: {
		anchor: true,
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
			displayPreview,
			previewHeight,
		} = attributes;

		const pdfEmbedLabel = RichText.isEmpty( fileName )
			? __( 'PDF embed' )
			: sprintf(
					/* translators: %s: filename. */
					__( 'Embed of %s.' ),
					fileName
			  );

		return (
			href && (
				<div { ...useBlockProps.save() }>
					{ displayPreview && (
						<>
							<object
								className="wp-block-file__embed"
								data={ href }
								type="application/pdf"
								style={ {
									width: '100%',
									height: `${ previewHeight }px`,
								} }
								aria-label={ pdfEmbedLabel }
							/>
						</>
					) }
					{ ! RichText.isEmpty( fileName ) && (
						<a
							href={ textLinkHref }
							target={ textLinkTarget }
							rel={
								textLinkTarget
									? 'noreferrer noopener'
									: undefined
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
							<RichText.Content value={ downloadButtonText } />
						</a>
					) }
				</div>
			)
		);
	},
};

const deprecated = [ v3, v2, v1 ];

export default deprecated;
