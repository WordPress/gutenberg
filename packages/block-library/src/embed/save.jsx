import clsx from 'clsx';
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';
import { toSourceList } from './sources';

export default function save( { attributes } ) {
	const { url, caption, type, providerNameSlug, fallbacks } = attributes;

	if ( ! url ) {
		return null;
	}

	const className = clsx( 'wp-block-embed', {
		[ `is-type-${ type }` ]: type,
		[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
		[ `wp-block-embed-${ providerNameSlug }` ]: providerNameSlug,
	} );

	// Only emitted when fallbacks are set, so blocks without them save exactly
	// as before and no deprecation is needed.
	const sources = toSourceList( fallbacks );
	const fallbackProps = sources.length
		? { 'data-fallbacks': sources.join( ' ' ) }
		: {};

	return (
		<figure { ...useBlockProps.save( { className, ...fallbackProps } ) }>
			<div className="wp-block-embed__wrapper">
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
			</div>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					className={ __experimentalGetElementClassName( 'caption' ) }
					tagName="figcaption"
					value={ caption }
				/>
			) }
		</figure>
	);
}
