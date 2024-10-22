/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { __unstableGetBlockProps as getBlockProps } from '@wordpress/blocks';
import { useMergeRefs, useDisabled } from '@wordpress/compose';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import useMovingAnimation from '../../use-moving-animation';
import { PrivateBlockContext } from '../private-block-context';
import { useFocusFirstElement } from './use-focus-first-element';
import { useIsHovered } from './use-is-hovered';
import {
	blockBindingsKey,
	useBlockEditContext,
} from '../../block-edit/context';
import { useFocusHandler } from './use-focus-handler';
import { useEventHandlers } from './use-selected-block-event-handlers';
import { useZoomOutModeExit } from './use-zoom-out-mode-exit';
import { useBlockRefProvider } from './use-block-refs';
import { useIntersectionObserver } from './use-intersection-observer';
import { useScrollIntoView } from './use-scroll-into-view';
import { useFlashEditableBlocks } from '../../use-flash-editable-blocks';
import { canBindBlock } from '../../../hooks/use-bindings-attributes';

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
 *   const blockProps = useBlockProps( {
 *     className: 'my-custom-class',
 *     style: {
 *       color: '#222222',
 *       backgroundColor: '#eeeeee'
 *     }
 *   } )
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
 * @param {Object}  props                    Optional. Props to pass to the element. Must contain
 *                                           the ref if one is defined.
 * @param {Object}  options                  Options for internal use only.
 * @param {boolean} options.__unstableIsHtml
 *
 * @return {Object} Props to pass to the element to mark as a block.
 */
export function useBlockProps( props = {}, { __unstableIsHtml } = {} ) {
	const {
		clientId,
		className,
		wrapperProps = {},
		isAligned,
		index,
		mode,
		name,
		blockApiVersion,
		blockTitle,
		isSelected,
		isSubtreeDisabled,
		hasOverlay,
		initialPosition,
		blockEditingMode,
		isHighlighted,
		isMultiSelected,
		isPartiallySelected,
		isReusable,
		isDragging,
		hasChildSelected,
		isEditingDisabled,
		hasEditableOutline,
		isTemporarilyEditingAsBlocks,
		defaultClassName,
		isSectionBlock,
	} = useContext( PrivateBlockContext );

	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockTitle );
	const htmlSuffix = mode === 'html' && ! __unstableIsHtml ? '-visual' : '';
	const mergedRefs = useMergeRefs( [
		props.ref,
		useFocusFirstElement( { clientId, initialPosition } ),
		useBlockRefProvider( clientId ),
		useFocusHandler( clientId ),
		useEventHandlers( { clientId, isSelected } ),
		useZoomOutModeExit(),
		useIsHovered( { clientId } ),
		useIntersectionObserver(),
		useMovingAnimation( { triggerAnimationOnChange: index, clientId } ),
		useDisabled( { isDisabled: ! hasOverlay } ),
		useFlashEditableBlocks( {
			clientId,
			isEnabled: isSectionBlock,
		} ),
		useScrollIntoView( { isSelected } ),
	] );

	const blockEditContext = useBlockEditContext();
	const hasBlockBindings = !! blockEditContext[ blockBindingsKey ];
	const bindingsStyle =
		hasBlockBindings && canBindBlock( name )
			? {
					'--wp-admin-theme-color': 'var(--wp-block-synced-color)',
					'--wp-admin-theme-color--rgb':
						'var(--wp-block-synced-color--rgb)',
			  }
			: {};

	// Ensures it warns only inside the `edit` implementation for the block.
	if ( blockApiVersion < 2 && clientId === blockEditContext.clientId ) {
		warning(
			`Block type "${ name }" must support API version 2 or higher to work correctly with "useBlockProps" method.`
		);
	}

	let hasNegativeMargin = false;
	if (
		wrapperProps?.style?.marginTop?.charAt( 0 ) === '-' ||
		wrapperProps?.style?.marginBottom?.charAt( 0 ) === '-' ||
		wrapperProps?.style?.marginLeft?.charAt( 0 ) === '-' ||
		wrapperProps?.style?.marginRight?.charAt( 0 ) === '-'
	) {
		hasNegativeMargin = true;
	}

	return {
		tabIndex: blockEditingMode === 'disabled' ? -1 : 0,
		...wrapperProps,
		...props,
		ref: mergedRefs,
		id: `block-${ clientId }${ htmlSuffix }`,
		role: 'document',
		'aria-label': blockLabel,
		'data-block': clientId,
		'data-type': name,
		'data-title': blockTitle,
		inert: isSubtreeDisabled ? 'true' : undefined,
		className: clsx(
			'block-editor-block-list__block',
			{
				// The wp-block className is important for editor styles.
				'wp-block': ! isAligned,
				'has-block-overlay': hasOverlay,
				'is-selected': isSelected,
				'is-highlighted': isHighlighted,
				'is-multi-selected': isMultiSelected,
				'is-partially-selected': isPartiallySelected,
				'is-reusable': isReusable,
				'is-dragging': isDragging,
				'has-child-selected': hasChildSelected,
				'is-editing-disabled': isEditingDisabled,
				'has-editable-outline': hasEditableOutline,
				'has-negative-margin': hasNegativeMargin,
				'is-content-locked-temporarily-editing-as-blocks':
					isTemporarilyEditingAsBlocks,
			},
			className,
			props.className,
			wrapperProps.className,
			defaultClassName
		),
		style: { ...wrapperProps.style, ...props.style, ...bindingsStyle },
	};
}

/**
 * Call within a save function to get the props for the block wrapper.
 *
 * @param {Object} props Optional. Props to pass to the element.
 */
useBlockProps.save = getBlockProps;
