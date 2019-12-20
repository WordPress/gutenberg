/**
 * Internal dependencies
 */
import { getEmbedEditComponent } from './edit';

/**
 * External dependencies
 */
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { RichText } from '@wordpress/block-editor';
import { withSelect, withDispatch } from '@wordpress/data';

const embedAttributes = {
	url: {
		type: 'string',
	},
	caption: {
		type: 'string',
		source: 'html',
		selector: 'figcaption',
	},
	type: {
		type: 'string',
	},
	providerNameSlug: {
		type: 'string',
	},
	allowResponsive: {
		type: 'boolean',
		default: true,
	},
};

export function getEmbedBlockSettings( { title, description, icon, category = 'embed', transforms, keywords = [], supports = {}, responsive = true } ) {
	const blockDescription = description || __( 'Add a block that displays content pulled from other sites, like Twitter, Instagram or YouTube.' );
	const edit = getEmbedEditComponent( title, icon, responsive );
	return {
		title,
		description: blockDescription,
		icon,
		category,
		keywords,
		attributes: embedAttributes,

		supports: {
			align: true,
			...supports,
		},

		transforms,

		edit: compose(
			withSelect( ( select, ownProps ) => {
				const { url } = ownProps.attributes;
				const core = select( 'core' );
				const { getEmbedPreview, isPreviewEmbedFallback, isRequestingEmbedPreview, getThemeSupports } = core;
				const preview = undefined !== url && getEmbedPreview( url );
				const previewIsFallback = undefined !== url && isPreviewEmbedFallback( url );
				const fetching = undefined !== url && isRequestingEmbedPreview( url );
				const themeSupports = getThemeSupports();
				// The external oEmbed provider does not exist. We got no type info and no html.
				const badEmbedProvider = !! preview && undefined === preview.type && false === preview.html;
				// Some WordPress URLs that can't be embedded will cause the API to return
				// a valid JSON response with no HTML and `data.status` set to 404, rather
				// than generating a fallback response as other embeds do.
				const wordpressCantEmbed = !! preview && preview.data && preview.data.status === 404;
				const validPreview = !! preview && ! badEmbedProvider && ! wordpressCantEmbed;
				const cannotEmbed = undefined !== url && ( ! validPreview || previewIsFallback );
				return {
					preview: validPreview ? preview : undefined,
					fetching,
					themeSupportsResponsive: themeSupports[ 'responsive-embeds' ],
					cannotEmbed,
				};
			} ),
			withDispatch( ( dispatch, ownProps ) => {
				const { url } = ownProps.attributes;
				const coreData = dispatch( 'core/data' );
				const tryAgain = () => {
					coreData.invalidateResolution( 'core', 'getEmbedPreview', [ url ] );
				};
				return {
					tryAgain,
				};
			} )
		)( edit ),

		save( { attributes } ) {
			const { url, caption, type, providerNameSlug } = attributes;

			if ( ! url ) {
				return null;
			}

			const embedClassName = classnames( 'wp-block-embed', {
				[ `is-type-${ type }` ]: type,
				[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
			} );

			return (
				<figure className={ embedClassName }>
					<div className="wp-block-embed__wrapper">
						{ `\n${ url }\n` /* URL needs to be on its own line. */ }
					</div>
					{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
				</figure>
			);
		},

		deprecated: [
			{
				attributes: embedAttributes,
				save( { attributes } ) {
					const { url, caption, type, providerNameSlug } = attributes;

					if ( ! url ) {
						return null;
					}

					const embedClassName = classnames( 'wp-block-embed', {
						[ `is-type-${ type }` ]: type,
						[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
					} );

					return (
						<figure className={ embedClassName }>
							{ `\n${ url }\n` /* URL needs to be on its own line. */ }
							{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
						</figure>
					);
				},
			},
		],
	};
}
