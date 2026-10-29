import { __, sprintf } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { plus } from '@wordpress/icons';
import type { LinkControlSearchCreateProps } from './types';

export const LinkControlSearchCreate = ( {
	searchTerm,
	onClick,
	itemProps,
	buttonText,
}: LinkControlSearchCreateProps ) => {
	if ( ! searchTerm ) {
		return null;
	}

	let text;
	if ( buttonText ) {
		text =
			typeof buttonText === 'function'
				? buttonText( searchTerm )
				: buttonText;
	} else {
		text = createInterpolateElement(
			sprintf(
				/* translators: %s: search term. */
				__( 'Create: <mark>%s</mark>' ),
				searchTerm
			),
			{ mark: <mark /> }
		);
	}

	return (
		<MenuItem
			{ ...itemProps }
			iconPosition="left"
			icon={ plus }
			className="block-editor-link-control__search-item"
			onClick={ onClick }
		>
			{ text }
		</MenuItem>
	);
};

export default LinkControlSearchCreate;
