/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	__unstableGetBlockProps as getBlockProps,
	getBlockType,
} from '@wordpress/blocks';
import { useMergeRefs } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import useMovingAnimation from '../../use-moving-animation';
import { BlockListBlockContext } from '../block';
import { useFocusFirstElement } from './use-focus-first-element';
import { useIsHovered } from './use-is-hovered';
import { useBlockEditContext } from '../../block-edit/context';
import { useBlockClassNames } from './use-block-class-names';
import { useBlockDefaultClassName } from './use-block-default-class-name';
import { useBlockCustomClassName } from './use-block-custom-class-name';
import { useBlockMovingModeClassNames } from './use-block-moving-mode-class-names';
import { useFocusHandler } from './use-focus-handler';
import { useEventHandlers } from './use-selected-block-event-handlers';
import { useNavModeExit } from './use-nav-mode-exit';
import { useScrollIntoView } from './use-scroll-into-view';
import { useBlockRefProvider } from './use-block-refs';
import { useMultiSelection } from './use-multi-selection';
import { useIntersectionObserver } from './use-intersection-observer';
import { store as blockEditorStore } from '../../../store';

/**
 * If the block count exceeds the threshold, we disable the reordering animation
 * to avoid laginess.
 */
const BLOCK_ANIMATION_THRESHOLD = 200;

/**
 * This hook is used to lightly mark an element as a block element. The element
 * should be the outermost element of a block. Call this hook and pass the
 * returned props to the element to mark as a block. If you define a ref for the
 * element, it is important to pass the ref to this hook, which the hook in turn
 * will pass to the component through the props it returns. Optionally, you can
 * also pass any other props through this hook, and they will be merged and
 * returned.
 *
 * @param {Object}  props                    Optional. Props to pass to the element. Must contain
 *                                           the ref if one is defined.
 * @param {Object}  options                  Options for internal use only.
 * @param {boolean} options.__unstableIsHtml
 *
 * @return {Object} Props to pass to the element to mark as a block.
 */
export function useBlockProps( props = {}, { __unstableIsHtml } = {} ) {
	const { clientId, className, wrapperProps = {}, isAligned } = useContext(
		BlockListBlockContext
	);
	const {
		index,
		mode,
		name,
		blockApiVersion,
		blockTitle,
		isPartOfSelection,
		adjustScrolling,
		enableAnimation,
	} = useSelect(
		( select ) => {
			const {
				getBlockIndex,
				getBlockMode,
				getBlockName,
				isTyping,
				getGlobalBlockCount,
				isBlockSelected,
				isBlockMultiSelected,
				isAncestorMultiSelected,
				isFirstMultiSelectedBlock,
			} = select( blockEditorStore );
			const isSelected = isBlockSelected( clientId );
			const isPartOfMultiSelection =
				isBlockMultiSelected( clientId ) ||
				isAncestorMultiSelected( clientId );
			const blockName = getBlockName( clientId );
			const blockType = getBlockType( blockName );

			return {
				index: getBlockIndex( clientId ),
				mode: getBlockMode( clientId ),
				name: blockName,
				blockApiVersion: blockType?.apiVersion || 1,
				blockTitle: blockType?.title,
				isPartOfSelection: isSelected || isPartOfMultiSelection,
				adjustScrolling:
					isSelected || isFirstMultiSelectedBlock( clientId ),
				enableAnimation:
					! isTyping() &&
					getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD,
			};
		},
		[ clientId ]
	);

	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockTitle );
	const htmlSuffix = mode === 'html' && ! __unstableIsHtml ? '-visual' : '';
	const mergedRefs = useMergeRefs( [
		props.ref,
		useFocusFirstElement( clientId ),
		// Must happen after focus because we check for focus in the block.
		useScrollIntoView( clientId ),
		useBlockRefProvider( clientId ),
		useFocusHandler( clientId ),
		useMultiSelection( clientId ),
		useEventHandlers( clientId ),
		useNavModeExit( clientId ),
		useIsHovered(),
		useIntersectionObserver(),
		useMovingAnimation( {
			isSelected: isPartOfSelection,
			adjustScrolling,
			enableAnimation,
			triggerAnimationOnChange: index,
		} ),
	] );

	const blockEditContext = useBlockEditContext();
	// Ensures it warns only inside the `edit` implementation for the block.
	if ( blockApiVersion < 2 && clientId === blockEditContext.clientId ) {
		warning(
			`Block type "${ name }" must support API version 2 or higher to work correctly with "useBlockProps" method.`
		);
	}

	return {
		...wrapperProps,
		...props,
		ref: mergedRefs,
		id: `block-${ clientId }${ htmlSuffix }`,
		tabIndex: 0,
		contentEditable: false,
		role: 'document',
		'aria-label': blockLabel,
		'data-block': clientId,
		'data-type': name,
		'data-title': blockTitle,
		className: classnames(
			// The wp-block className is important for editor styles.
			classnames( 'block-editor-block-list__block', {
				'wp-block': ! isAligned,
			} ),
			className,
			props.className,
			wrapperProps.className,
			useBlockClassNames( clientId ),
			useBlockDefaultClassName( clientId ),
			useBlockCustomClassName( clientId ),
			useBlockMovingModeClassNames( clientId )
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
