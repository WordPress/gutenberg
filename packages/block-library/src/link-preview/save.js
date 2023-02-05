/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { url, title, image, icon } = attributes;

	if ( ! url || ! title ) {
		return null;
	}

	return (
		<a { ...useBlockProps.save( { href: url } ) }>
			<img src={ image } alt={ title } />
			<div>
				<strong>{ title }</strong>
				<br />
				<span>
					<img
						className="link-preview__icon"
						src={ icon }
						alt={ new URL( url ).host }
					/>{ ' ' }
					{ new URL( url ).host }
				</span>
			</div>
		</a>
	);
}
