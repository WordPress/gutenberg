/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import ELEMENTS from './block-wrapper-elements';
import { useBlockProps } from './use-block-props';

const BlockComponent = forwardRef(
	( { children, tagName: TagName = 'div', ...props }, ref ) => {
		deprecated( 'wp.blockEditor.__experimentalBlock', {
			since: '5.6',
			alternative: 'wp.blockEditor.useBlockProps',
		} );
		const blockProps = useBlockProps( { ...props, ref } );
		return <TagName { ...blockProps }>{ children }</TagName>;
	}
);

const ExtendedBlockComponent = ELEMENTS.reduce( ( acc, element ) => {
	acc[ element ] = forwardRef( ( props, ref ) => {
		return <BlockComponent { ...props } ref={ ref } tagName={ element } />;
	} );
	return acc;
}, BlockComponent );

export const Block = ExtendedBlockComponent;
