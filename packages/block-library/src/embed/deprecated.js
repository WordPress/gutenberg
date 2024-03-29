/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { hasAspectRatioClass, removeAspectRatioClasses } from './util';
import { ASPECT_RATIOS } from './constants';

const v3 = {
	attributes: {
		url: {
			type: 'string',
			__experimentalRole: 'content',
		},
		caption: {
			type: 'rich-text',
			source: 'rich-text',
			selector: 'figcaption',
			__experimentalRole: 'content',
		},
		type: {
			type: 'string',
			__experimentalRole: 'content',
		},
		providerNameSlug: {
			type: 'string',
			__experimentalRole: 'content',
		},
		allowResponsive: {
			type: 'boolean',
			default: true,
		},
		responsive: {
			type: 'boolean',
			default: false,
			__experimentalRole: 'content',
		},
		previewable: {
			type: 'boolean',
			default: true,
			__experimentalRole: 'content',
		},
	},
	save( { attributes } ) {
		const { url, caption, type, providerNameSlug } = attributes;

		if ( ! url ) {
			return null;
		}

		const className = classnames( 'wp-block-embed', {
			[ `is-type-${ type }` ]: type,
			[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
			[ `wp-block-embed-${ providerNameSlug }` ]: providerNameSlug,
		} );

		return (
			<figure { ...useBlockProps.save( { className } ) }>
				<div className="wp-block-embed__wrapper">
					{ `\n${ url }\n` /* URL needs to be on its own line. */ }
				</div>
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content
						className={ __experimentalGetElementClassName(
							'caption'
						) }
						tagName="figcaption"
						value={ caption }
					/>
				) }
			</figure>
		);
	},
	isEligible: ( attributes ) => {
		return (
			attributes.className && hasAspectRatioClass( attributes.className )
		);
	},
	migrate: ( attributes ) => {
		const { className: existingClassname } = attributes;

		const aspectRatioFromBlockClassname = ASPECT_RATIOS.find(
			( { className } ) => {
				return existingClassname.includes( className );
			}
		);

		return {
			...attributes,
			className: removeAspectRatioClasses( existingClassname ),
			aspectRatio: aspectRatioFromBlockClassname
				? aspectRatioFromBlockClassname.ratio
				: '',
		};
	},
};

// In #41140 support was added to global styles for caption elements which added a `wp-element-caption` classname
// to the embed figcaption element.
const v2 = {
	attributes: {
		url: {
			type: 'string',
		},
		caption: {
			type: 'rich-text',
			source: 'rich-text',
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
		responsive: {
			type: 'boolean',
			default: false,
		},
		previewable: {
			type: 'boolean',
			default: true,
		},
		save( { attributes } ) {
			const { url, caption, type, providerNameSlug } = attributes;

			if ( ! url ) {
				return null;
			}

			const className = classnames( 'wp-block-embed', {
				[ `is-type-${ type }` ]: type,
				[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
				[ `wp-block-embed-${ providerNameSlug }` ]: providerNameSlug,
			} );

			return (
				<figure { ...useBlockProps.save( { className } ) }>
					<div className="wp-block-embed__wrapper">
						{
							`\n${ url }\n` /* URL needs to be on its own line. */
						}
					</div>
					{ ! RichText.isEmpty( caption ) && (
						<RichText.Content
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</figure>
			);
		},
	},
};

const v1 = {
	attributes: {
		url: {
			type: 'string',
		},
		caption: {
			type: 'rich-text',
			source: 'rich-text',
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
		responsive: {
			type: 'boolean',
			default: false,
		},
		previewable: {
			type: 'boolean',
			default: true,
		},
	},
	save( { attributes: { url, caption, type, providerNameSlug } } ) {
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
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};
const deprecated = [ v3, v2, v1 ];

export default deprecated;
