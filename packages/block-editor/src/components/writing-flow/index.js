/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';
import { getBlockType, store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useMultiSelection from './use-multi-selection';
import useTabNav from './use-tab-nav';
import useArrowNav from './use-arrow-nav';
import useSelectAll from './use-select-all';
import useDragSelection from './use-drag-selection';
import useSelectionObserver from './use-selection-observer';
import useClickSelection from './use-click-selection';
import useInput from './use-input';
import { store as blockEditorStore } from '../../store';

export function useWritingFlow() {
	const [ before, ref, after ] = useTabNav();
	const hasMultiSelection = useSelect(
		( select ) => select( blockEditorStore ).hasMultiSelection(),
		[]
	);
	const selectedBlockTitle = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlockName, getBlockAttributes } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		if ( ! clientId ) return;
		const blockName = getBlockName( clientId );
		const blockType = getBlockType( blockName );
		const attributes = getBlockAttributes( clientId );
		const { getActiveBlockVariation } = select( blocksStore );
		const match = getActiveBlockVariation( blockName, attributes );
		return match?.title || blockType?.title;
	}, [] );

	return [
		before,
		useMergeRefs( [
			ref,
			useInput(),
			useDragSelection(),
			useSelectionObserver(),
			useClickSelection(),
			useMultiSelection(),
			useSelectAll(),
			useArrowNav(),
			useRefEffect(
				( node ) => {
					node.tabIndex = -1;
					node.contentEditable = true;

					const label = selectedBlockTitle
						? // translators: %s: Type of block (i.e. Text, Image etc)
						  sprintf( __( 'Block: %s' ), selectedBlockTitle )
						: '';

					node.setAttribute(
						'aria-label',
						hasMultiSelection
							? __( 'Multiple selected blocks' )
							: label
					);

					if ( ! hasMultiSelection ) {
						return;
					}

					node.classList.add( 'has-multi-selection' );

					return () => {
						node.classList.remove( 'has-multi-selection' );
					};
				},
				[ hasMultiSelection, selectedBlockTitle ]
			),
		] ),
		after,
	];
}

function WritingFlow( { children, ...props }, forwardedRef ) {
	const [ before, ref, after ] = useWritingFlow();
	return (
		<>
			{ before }
			<div
				{ ...props }
				ref={ useMergeRefs( [ ref, forwardedRef ] ) }
				className={ classNames(
					props.className,
					'block-editor-writing-flow'
				) }
			>
				{ children }
			</div>
			{ after }
		</>
	);
}

/**
 * Handles selection and navigation across blocks. This component should be
 * wrapped around BlockList.
 *
 * @param {Object}    props          Component properties.
 * @param {WPElement} props.children Children to be rendered.
 */
export default forwardRef( WritingFlow );
