/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalGetElementClassName,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

// Version of the file block that included `rel="noreferrer noopener"` on the
// text link when opened in a new tab. Matches the saved output prior to the
// removal of `rel` from the current `save()` function.
const v4 = {
	attributes: {
		id: {
			type: 'number',
		},
		blob: {
			type: 'string',
			role: 'local',
		},
		href: {
			type: 'string',
			role: 'content',
		},
		fileId: {
			type: 'string',
			source: 'attribute',
			selector: 'a:not([download])',
			attribute: 'id',
		},
		fileName: {
			type: 'rich-text',
			source: 'rich-text',
			selector: 'a:not([download])',
			role: 'content',
		},
		textLinkHref: {
			type: 'string',
			source: 'attribute',
			selector: 'a:not([download])',
			attribute: 'href',
			role: 'content',
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
			type: 'rich-text',
			source: 'rich-text',
			selector: 'a[download]',
			role: 'content',
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
		spacing: {
			margin: true,
			padding: true,
		},
		color: {
			gradients: true,
			link: true,
			text: false,
			__experimentalDefaultControls: {
				background: true,
				link: true,
			},
		},
		__experimentalBorder: {
			radius: true,
			color: true,
			width: true,
			style: true,
			__experimentalDefaultControls: {
				radius: true,
				color: true,
				width: true,
				style: true,
			},
		},
		interactivity: true,
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
			? 'PDF embed'
			: // To do: use toPlainText, but we need ensure it's RichTextData. See
			  // https://github.com/WordPress/gutenberg/pull/56710.
			  fileName.toString();

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
							className={ clsx(
								'wp-block-file__button',
								__experimentalGetElementClassName( 'button' )
							) }
							download
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
							className={ clsx(
								'wp-block-file__button',
								__experimentalGetElementClassName( 'button' )
							) }
							download
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
							download
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
							download
						>
							<RichText.Content value={ downloadButtonText } />
						</a>
					) }
				</div>
			)
		);
	},
};

const deprecated = [ v4, v3, v2, v1 ];

export default deprecated;
