/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { __unstableGetBlockProps as getBlockProps } from '@wordpress/blocks';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useMovingAnimation from '../../use-moving-animation';
import { SetBlockNodes } from '../';
import { BlockListBlockContext } from '../block';
import { useFocusFirstElement } from './use-focus-first-element';
import { useIsHovered } from './use-is-hovered';
import { useBlockMovingModeClassNames } from './use-block-moving-mode-class-names';
import { useEventHandlers } from './use-event-handlers';
import { store as blockEditorStore } from '../../../store';

/**
 * This hook is used to lightly mark an element as a block element. The element
 * should be the outermost element of a block. Call this hook and pass the
 * returned props to the element to mark as a block. If you define a ref for the
 * element, it is important to pass the ref to this hook, which the hook in turn
 * will pass to the component through the props it returns. Optionally, you can
 * also pass any other props through this hook, and they will be merged and
 * returned.
 *
 * @param {Object}  props   Optional. Props to pass to the element. Must contain
 *                          the ref if one is defined.
 * @param {Object}  options Options for internal use only.
 * @param {boolean} options.__unstableIsHtml
 *
 * @return {Object} Props to pass to the element to mark as a block.
 */
export function useBlockProps( props = {}, { __unstableIsHtml } = {} ) {
	const fallbackRef = useRef();
	const ref = props.ref || fallbackRef;
	const setBlockNodes = useContext( SetBlockNodes );
	const {
		clientId,
		isSelected,
		isFirstMultiSelected,
		isLastMultiSelected,
		isPartOfMultiSelection,
		enableAnimation,
		index,
		className,
		name,
		blockTitle,
		wrapperProps = {},
	} = useContext( BlockListBlockContext );
	const mode = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlockMode( clientId );
	} );

	// Provide the selected node, or the first and last nodes of a multi-
	// selection, so it can be used to position the contextual block toolbar.
	// We only provide what is necessary, and remove the nodes again when they
	// are no longer selected.
	const isNodeNeeded =
		isSelected || isFirstMultiSelected || isLastMultiSelected;
	const nodesRef = useRefEffect(
		( node ) => {
			if ( ! isNodeNeeded ) {
				return;
			}

			setBlockNodes( ( nodes ) => ( {
				...nodes,
				[ clientId ]: node,
			} ) );

			return () => {
				setBlockNodes( ( nodes ) => omit( nodes, clientId ) );
			};
		},
		[ isNodeNeeded, clientId, setBlockNodes ]
	);

	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockTitle );

	useFocusFirstElement( ref, clientId );

	// Block Reordering animation
	useMovingAnimation(
		ref,
		isSelected || isPartOfMultiSelection,
		isSelected || isFirstMultiSelected,
		enableAnimation,
		index
	);

	const blockMovingModeClassNames = useBlockMovingModeClassNames( clientId );
	const htmlSuffix = mode === 'html' && ! __unstableIsHtml ? '-visual' : '';
	const mergedRefs = useMergeRefs( [
		ref,
		nodesRef,
		useEventHandlers( clientId ),
		useIsHovered(),
	] );

	return {
		...wrapperProps,
		...props,
		ref: mergedRefs,
		id: `block-${ clientId }${ htmlSuffix }`,
		tabIndex: 0,
		role: 'group',
		'aria-label': blockLabel,
		'data-block': clientId,
		'data-type': name,
		'data-title': blockTitle,
		className: classnames(
			className,
			props.className,
			wrapperProps.className,
			blockMovingModeClassNames
		),
		style: { ...wrapperProps.style, ...props.style },
	};
}

/**
 * Call within a save function to get the props for the block wrapper.
 *
 * @param {Object} props Optional. Props to pass to the element.
 */
useBlockProps.save = getBlockProps;
