/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

const PopoverSuggestionListContainer = forwardRef( ( { id, className, children }, ref ) => {
	return (
		<Popover
			position="bottom"
			noArrow
			focusOnMount={ false }
		>
			<div
				ref={ ref }
				role="listbox"
				id={ id }
				className={ classnames(
					'block-editor-url-input__suggestions',
					`${ className }__suggestions`
				) }
			>
				{ children }
			</div>
		</Popover>
	);
} );

export default PopoverSuggestionListContainer;
