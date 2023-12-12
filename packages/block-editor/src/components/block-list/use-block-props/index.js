/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	__unstableGetBlockProps as getBlockProps,
	getBlockType,
} from '@wordpress/blocks';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { BlockListBlockContext } from '../block-list-block-context';
import { useBlockEditContext } from '../../block-edit/context';

/**
 * This hook is used to lightly mark an element as a block element. The element
 * should be the outermost element of a block. Call this hook and pass the
 * returned props to the element to mark as a block. If you define a ref for the
 * element, it is important to pass the ref to this hook, which the hook in turn
 * will pass to the component through the props it returns. Optionally, you can
 * also pass any other props through this hook, and they will be merged and
 * returned.
 *
 * Use of this hook on the outermost element of a block is required if using API >= v2.
 *
 * @example
 * ```js
 * import { useBlockProps } from '@wordpress/block-editor';
 *
 * export default function Edit() {
 *
 *   const blockProps = useBlockProps(
 *     className: 'my-custom-class',
 *     style: {
 *       color: '#222222',
 *       backgroundColor: '#eeeeee'
 *     }
 *   )
 *
 *   return (
 *	    <div { ...blockProps }>
 *
 *     </div>
 *   )
 * }
 *
 * ```
 *
 *
 * @param {Object} props Optional. Props to pass to the element. Must contain
 *                       the ref if one is defined.
 *
 * @return {Object} Props to pass to the element to mark as a block.
 */
export function useBlockProps( props = {} ) {
	const blockProps = useContext( BlockListBlockContext );
	const { name } = useBlockEditContext();
	const blockType = getBlockType( name );
	const blockApiVersion = blockType?.apiVersion || 1;

	// Ensures it warns only inside the `edit` implementation for the block.
	if ( blockApiVersion < 2 ) {
		warning(
			`Block type "${ name }" must support API version 2 or higher to work correctly with "useBlockProps" method.`
		);
	}

	return {
		...blockProps,
		...props,
		className: classnames( props.className, blockProps.className ),
		style: { ...blockProps.style, ...props.style },
	};
}

/**
 * Call within a save function to get the props for the block wrapper.
 *
 * @param {Object} props Optional. Props to pass to the element.
 */
useBlockProps.save = getBlockProps;
