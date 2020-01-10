/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

const PopoverSuggestionListItem = forwardRef( ( { id, isSelected, onClick, suggestion }, ref ) => {
	return (
		<Button
			ref={ ref }
			id={ id }
			className={ classnames( 'block-editor-url-input__suggestion', {
				'is-selected': isSelected,
			} ) }
			role="option"
			tabIndex="-1"
			aria-selected={ isSelected }
			onClick={ onClick }
		>
			{ suggestion.title }
		</Button>
	);
} );

export default PopoverSuggestionListItem;
