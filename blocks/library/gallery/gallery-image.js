/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import Editable from '../../editable';

export default function GalleryImage( props ) {
	return (
		<figure className="blocks-gallery-image" onClick={ props.onSelect }>
			<img src={ props.img.url } alt={ props.img.alt } />
			{ props.focus &&
				<Editable
					tagName="figcaption"
					placeholder={ __( 'Write caption…' ) }
					focus={ props.focus }
					inlineToolbar
				/>
			}
		</figure>
	);
}
