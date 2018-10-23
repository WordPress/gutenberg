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
import { Fragment } from '@wordpress/element';
import {
	Button,
	Placeholder,
	Spinner,
	SandBox,
	IconButton,
	Toolbar,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import { RichText, BlockControls, BlockIcon, InspectorControls } from '@wordpress/editor';

export const EmbedLoading = () => (
	<div className="wp-block-embed is-loading">
		<Spinner />
		<p>{ __( 'Embedding…' ) }</p>
	</div>
);

export const EmbedPreview = ( props ) => {
	const { preview, url, type, caption, onCaptionChange, isSelected, className, icon, label } = props;
	const { scripts } = preview;

	const html = 'photo' === type ? getPhotoHtml( preview ) : preview.html;
	const parsedUrl = parse( url );
	const cannotPreview = includes( HOSTS_NO_PREVIEWS, parsedUrl.host.replace( /^www\./, '' ) );
	// translators: %s: host providing embed content e.g: www.youtube.com
	const iframeTitle = sprintf( __( 'Embedded content from %s' ), parsedUrl.host );
	const sandboxClassnames = classnames( type, className, 'wp-block-embed__wrapper' );

	const embedWrapper = 'wp-embed' === type ? (
		<div
			className={ sandboxClassnames }
			dangerouslySetInnerHTML={ { __html: html } }
		/>
	) : (
		<div className="wp-block-embed__wrapper">
			<SandBox
				html={ html }
				scripts={ scripts }
				title={ iframeTitle }
				type={ sandboxClassnames }
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

export const EmbedControls = ( props ) => {
	const { showEditButton, supportsResponsive, allowResponsive, getResponsiveHelp, toggleResponsive, switchBackToURLInput } = props;
	return (
		<Fragment>
			<BlockControls>
				<Toolbar>
					{ showEditButton && (
						<IconButton
							className="components-toolbar__control"
							label={ __( 'Edit URL' ) }
							icon="edit"
							onClick={ switchBackToURLInput }
						/>
					) }
				</Toolbar>
			</BlockControls>
			{ supportsResponsive && (
				<InspectorControls>
					<PanelBody title={ __( 'Media Settings' ) } className="blocks-responsive">
						<ToggleControl
							label={ __( 'Automatically scale content' ) }
							checked={ allowResponsive }
							help={ getResponsiveHelp }
							onChange={ toggleResponsive }
						/>
					</PanelBody>
				</InspectorControls>
			) }
		</Fragment>
	);
};

export const EmbedEditUrl = ( props ) => {
	const { icon, label, value, onSubmit, onChange, cannotEmbed } = props;
	return (
		<Placeholder icon={ <BlockIcon icon={ icon } showColors /> } label={ label } className="wp-block-embed">
			<form onSubmit={ onSubmit }>
				<input
					type="url"
					value={ value || '' }
					className="components-placeholder__input"
					aria-label={ label }
					placeholder={ __( 'Enter URL to embed here…' ) }
					onChange={ onChange } />
				<Button
					isLarge
					type="submit">
					{ __( 'Embed' ) }
				</Button>
				{ cannotEmbed && <p className="components-placeholder__error">{ __( 'Sorry, we could not embed that content.' ) }</p> }
			</form>
		</Placeholder>
	);
};
