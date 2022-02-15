/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useMultiSelection from './use-multi-selection';
import useTabNav from './use-tab-nav';
import useArrowNav from './use-arrow-nav';
import useSelectAll from './use-select-all';
import { store as blockEditorStore } from '../../store';

function findContentEditableRoot( node ) {
	if ( node.nodeType !== node.ELEMENT_NODE ) {
		node = node.parentElement;
	}

	if ( ! node ) {
		return;
	}

	return node.closest( '[contenteditable]' );
}

export function useWritingFlow() {
	const [ before, ref, after ] = useTabNav();
	const hasMultiSelection = useSelect(
		( select ) => select( blockEditorStore ).hasMultiSelection(),
		[]
	);

	return [
		before,
		useMergeRefs( [
			ref,
			useMultiSelection(),
			useSelectAll(),
			useArrowNav(),
			useRefEffect(
				( node ) => {
					node.tabIndex = -1;

					if ( ! hasMultiSelection ) {
						return;
					}

					node.setAttribute(
						'aria-label',
						__( 'Multiple selected blocks' )
					);

					return () => {
						node.removeAttribute( 'aria-label' );
					};
				},
				[ hasMultiSelection ]
			),
			useRefEffect(
				( node ) => {
					node.contentEditable = true;

					function delegate( event ) {
						if ( event.defaultPrevented ) {
							return;
						}

						const { ownerDocument } = node;
						const { defaultView } = ownerDocument;
						const selection = defaultView.getSelection();
						const { anchorNode, focusNode } = selection;
						const anchorNodeRoot = findContentEditableRoot(
							anchorNode
						);
						const focusNodeRoot = findContentEditableRoot(
							focusNode
						);

						if ( anchorNodeRoot === focusNodeRoot ) {
							const init = {};

							for ( const key in event ) {
								init[ key ] = event[ key ];
							}

							init.bubbles = false;

							const prototype = Object.getPrototypeOf( event );
							const constructorName = prototype.constructor.name;
							const Constructor = defaultView[ constructorName ];
							const newEvent = new Constructor(
								event.type,
								init
							);
							const cancelled = ! anchorNodeRoot.dispatchEvent(
								newEvent
							);

							if ( cancelled ) event.preventDefault();
						} else {
							event.preventDefault();
						}
					}

					const events = [ 'keydown', 'keypress', 'keyup', 'input' ];

					events.forEach( ( eventName ) => {
						node.addEventListener( eventName, delegate );
					} );

					return () => {
						events.forEach( ( eventName ) => {
							node.removeEventListener( eventName, delegate );
						} );
					};
				},
				[ hasMultiSelection ]
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
