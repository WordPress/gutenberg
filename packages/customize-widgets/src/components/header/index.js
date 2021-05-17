/**
 * WordPress dependencies
 */
import { createPortal } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Button, ToolbarItem } from '@wordpress/components';
import { NavigableToolbar } from '@wordpress/block-editor';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import useScrollGesture from '../../hooks/use-scroll-gesture';

function onScrollUp( { deltaY }, node ) {
	// Transition the node's top style between an offscreen position and 0,
	// offsetting by the scroll deltaY.
	const offset = parseInt( node.style.top || 0, 10 ) - deltaY;
	node.style.top = `${ Math.min( 0, offset ) }px`;
}

function onScrollDown( { deltaY }, node ) {
	// Transition the node's top style between 0 and an offscreen position
	// (calculated using the node's height), offsetting by the scroll deltaY.
	const nodeRect = node.getBoundingClientRect();
	const offset = parseInt( node.style.top || 0, 10 ) - deltaY;
	node.style.top = `${ Math.max( -nodeRect.height, offset ) }px`;
}

function Header( { inserter, isInserterOpened, setIsInserterOpened } ) {
	return (
		<>
			<div
				className="customize-widgets-header"
				ref={ useScrollGesture( { onScrollUp, onScrollDown } ) }
			>
				<NavigableToolbar
					className="customize-widgets-header-toolbar"
					aria-label={ __( 'Document tools' ) }
				>
					<ToolbarItem
						as={ Button }
						className="customize-widgets-header-toolbar__inserter-toggle"
						isPressed={ isInserterOpened }
						isPrimary
						icon={ plus }
						label={ _x(
							'Add block',
							'Generic label for block inserter button'
						) }
						onClick={ () => {
							setIsInserterOpened( ( isOpen ) => ! isOpen );
						} }
					/>
				</NavigableToolbar>
			</div>

			{ createPortal(
				<Inserter setIsOpened={ setIsInserterOpened } />,
				inserter.contentContainer[ 0 ]
			) }
		</>
	);
}

export default Header;
