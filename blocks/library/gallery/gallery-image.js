/**
 * External Depenedencies
 */
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function GalleryImage( props ) {
	let href = null;
	switch ( props.linkTo ) {
		case 'media':
			href = props.img.url;
			break;
		case 'attachment':
			href = props.img.link;
			break;
	}

	const image = <img src={ props.img.url } alt={ props.img.alt } data-id={ props.img.id } />;
	const className = classnames( 'blocks-gallery-image', {
		'is-selected': props.isSelected,
	} );

	// Disable reason: Each block can be selected by clicking on it and we should keep the same saved markup
	/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	return (
		<figure className={ className } onClick={ props.onClick }>
			{ props.isSelected &&
				<div className="blocks-gallery-image__inline-menu">
					<IconButton
						icon="no-alt"
						onClick={ props.onRemove }
						className="blocks-gallery-image__remove"
						label={ __( 'Remove Image' ) }
					/>
				</div>
			}
			{ href ? <a href={ href }>{ image }</a> : image }
		</figure>
	);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
}
