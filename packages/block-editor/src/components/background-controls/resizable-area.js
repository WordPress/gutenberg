/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { ResizableBox } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	COVER_MIN_HEIGHT,

} from './shared';

const RESIZABLE_BOX_ENABLE_OPTION = {
	top: false,
	right: false,
	bottom: true,
	left: false,
	topRight: false,
	bottomRight: false,
	bottomLeft: false,
	topLeft: false,
};

export default function ResizableArea( {
	className,
	children,
	onResizeStart,
	onResize,
	onResizeStop,
} ) {
	const [ isResizing, setIsResizing ] = useState( false );

	return (
		<ResizableBox
			className={ classnames(
				className,
				{
					'is-resizing': isResizing,
				}
			) }
			enable={ RESIZABLE_BOX_ENABLE_OPTION }
			onResizeStart={ ( event, direction, elt ) => {
				onResizeStart( elt.clientHeight );
				onResize( elt.clientHeight );
			} }
			onResize={ ( event, direction, elt ) => {
				onResize( elt.clientHeight );
				if ( ! isResizing ) {
					setIsResizing( true );
				}
			} }
			onResizeStop={ ( event, direction, elt ) => {
				onResizeStop( elt.clientHeight );
				setIsResizing( false );
			} }
			minHeight={ COVER_MIN_HEIGHT }
		>
			{ children }
		</ResizableBox>
	);
}
