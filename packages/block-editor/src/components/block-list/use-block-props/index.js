/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __unstableGetBlockProps as getBlockProps } from '@wordpress/blocks';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BlockListBlockContext } from '../block-list-block-context';

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
	const { essentialProps, wrapperProps, refs } = useContext(
		BlockListBlockContext
	);

	return {
		...wrapperProps,
		// Individual block props can override wrapper props.
		...props,
		// Essential props are always passed through.
		...essentialProps,
		// wrapperProps has never been able to pass a ref, so let's not add that
		// since it's an API we're likely to deprecate in the future.
		ref: useMergeRefs( [ props.ref, ...refs ] ),
		className: classnames(
			wrapperProps.className,
			props.className,
			essentialProps.className
		),
		style: {
			...wrapperProps.style,
			...props.style,
			...essentialProps.style,
		},
	};
}

/**
 * Call within a save function to get the props for the block wrapper.
 *
 * @param {Object} props Optional. Props to pass to the element.
 */
useBlockProps.save = getBlockProps;
