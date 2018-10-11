/**
 * Internal dependencies
 */
import { HOSTS_NO_PREVIEWS } from './constants';
import { getPhotoHtml } from './util';

/**
 * External dependencies
 */
import { parse } from 'url';
import { includes } from 'lodash';
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Placeholder, SandBox } from '@wordpress/components';
import { RichText, BlockIcon } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import WpEmbedPreview from './wp-embed-preview';

const EmbedPreview = ( props ) => {
	const { preview, url, type, caption, onCaptionChange, isSelected, className, icon, label, interactive } = props;
	const { scripts } = preview;

	const html = 'photo' === type ? getPhotoHtml( preview ) : preview.html;
	const parsedUrl = parse( url );
	const cannotPreview = includes( HOSTS_NO_PREVIEWS, parsedUrl.host.replace( /^www\./, '' ) );
	// translators: %s: host providing embed content e.g: www.youtube.com
	const iframeTitle = sprintf( __( 'Embedded content from %s' ), parsedUrl.host );
	const sandboxClassnames = classnames( type, className, 'wp-block-embed__wrapper' );

	const embedWrapper = 'wp-embed' === type ? (
		<WpEmbedPreview
			html={ html }
		/>
	) : (
		<div className="wp-block-embed__wrapper">
			<SandBox
				html={ html }
				scripts={ scripts }
				title={ iframeTitle }
				type={ sandboxClassnames }
				interactive={ interactive }
			/>
		</div>
	);

	return (
		<figure className={ classnames( className, 'wp-block-embed', { 'is-type-video': 'video' === type } ) }>
			{ ( cannotPreview ) ? (
				<Placeholder icon={ <BlockIcon icon={ icon } showColors /> } label={ label }>
					<p className="components-placeholder__error"><a href={ url }>{ url }</a></p>
					<p className="components-placeholder__error">{ __( 'Previews for this are unavailable in the editor, sorry!' ) }</p>
				</Placeholder>
			) : embedWrapper }
			{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
				<RichText
					tagName="figcaption"
					placeholder={ __( 'Write caption…' ) }
					value={ caption }
					onChange={ onCaptionChange }
					inlineToolbar
				/>
			) }
		</figure>
	);
};

export default EmbedPreview;
