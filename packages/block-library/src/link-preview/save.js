/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { url, title, image, icon } = attributes;

	if ( ! url ) {
		return null;
	}

	return (
		<a
			{ ...useBlockProps.save( {
				href: url,
				className: image ? 'has-image' : undefined,
			} ) }
		>
			{ image && <img src={ image } alt={ title } /> }
			<div>
				{ title && <strong>{ title }</strong> }
				{ icon && (
					<img
						className="link-preview__icon"
						src={ icon }
						alt={ new URL( url ).host }
					/>
				) }
				{ title ? new URL( url ).host.replace( /^www\./, '' ) : url }
			</div>
		</a>
	);
}
