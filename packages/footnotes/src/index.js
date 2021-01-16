/**
 * WordPress dependencies
 */
import { registerFormatType } from '@wordpress/rich-text';
import { Slot } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import format from './format';

registerFormatType( format.name, format );

const List = forwardRef( ( props, ref ) => (
	<ol ref={ ref } { ...props } className="wp-block" />
) );

addFilter(
	'blockEditor.BlockListItems',
	'core/footnotes',
	( BlockListItems ) => () => (
		<>
			<BlockListItems />
			<Slot
				name="__unstable-footnote-controls"
				as={ List }
				bubblesVirtually
			/>
		</>
	)
);
