/**
 * External dependencies
 */
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useState, useEffect, useCallback } from '@wordpress/element';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export default function ExpandedBlockControlsContainer( {
	children,
	className,
} ) {
	return (
		<BlockControls.Slot __experimentalIsExpanded>
			{ ( fills ) => {
				return (
					<ExpandedBlockControlsHandler
						className={ className }
						fills={ fills }
					>
						{ children }
					</ExpandedBlockControlsHandler>
				);
			} }
		</BlockControls.Slot>
	);
}

function ExpandedBlockControlsHandler( { fills, className = '', children } ) {
	const containerRef = useRef();
	const fillsRef = useRef();
	const toolbarRef = useRef();
	const [ dimensions, setDimensions ] = useState( {} );

	const fillsPropRef = useRef();
	fillsPropRef.current = fills;
	const resizeToolbar = useCallback(
		throttle( () => {
			const toolbarContentElement = fillsPropRef.current.length
				? fillsRef.current
				: toolbarRef.current;
			if ( ! toolbarContentElement ) {
				return;
			}
			toolbarContentElement.style.position = 'absolute';
			toolbarContentElement.style.width = 'auto';
			const contentCSS = getComputedStyle( toolbarContentElement );
			setDimensions( {
				width: contentCSS.getPropertyValue( 'width' ),
				height: contentCSS.getPropertyValue( 'height' ),
			} );
			toolbarContentElement.style.position = '';
			toolbarContentElement.style.width = '';
		}, 100 ),
		[]
	);

	useEffect( () => {
		const observer = new window.MutationObserver( function (
			mutationsList
		) {
			const hasChildList = mutationsList.find(
				( { type } ) => type === 'childList'
			);
			if ( hasChildList ) {
				resizeToolbar();
			}
		} );

		observer.observe( containerRef.current, {
			childList: true,
			subtree: true,
		} );

		return () => observer.disconnect();
	}, [] );

	useEffect( () => {
		if ( fills.length > 1 ) {
			warning(
				`${ fills.length } <BlockControls isExpanded> slots were registered but only one may be displayed.`
			);
		}
	}, [ fills.length ] );

	const displayFill = fills[ 0 ];
	return (
		<div
			className="block-editor-block-toolbar-animated-width-container"
			ref={ containerRef }
			style={ dimensions }
		>
			<TransitionGroup>
				{ displayFill ? (
					<CSSTransition
						key="fills"
						timeout={ 300 }
						classNames="block-editor-block-toolbar-content"
					>
						<div className={ className } ref={ fillsRef }>
							{ displayFill }
						</div>
					</CSSTransition>
				) : (
					<CSSTransition
						key="default"
						timeout={ 300 }
						classNames="block-editor-block-toolbar-content"
					>
						<div className={ className } ref={ toolbarRef }>
							{ children }
						</div>
					</CSSTransition>
				) }
			</TransitionGroup>
		</div>
	);
}
