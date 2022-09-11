/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { ResizableBox } from '@wordpress/components';

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

export default function ResizableCover( {
	className,
	onResizeStart,
	onResize,
	onResizeStop,
	...props
} ) {
	const [ isResizing, setIsResizing ] = useState( false );

	return (
		<ResizableBox
			className={ classnames( className, {
				'is-resizing': isResizing,
			} ) }
			enable={ RESIZABLE_BOX_ENABLE_OPTION }
			onResizeStart={ ( _event, _direction, elt ) => {
				onResizeStart( elt.clientHeight );
				onResize( elt.clientHeight );
			} }
			onResize={ ( _event, _direction, elt ) => {
				onResize( elt.clientHeight );
				if ( ! isResizing ) {
					setIsResizing( true );
				}
			} }
			onResizeStop={ ( _event, _direction, elt ) => {
				onResizeStop( elt.clientHeight );
				setIsResizing( false );
			} }
			__experimentalShowTooltip
			__experimentalTooltipProps={ {
				axis: 'y',
				position: 'bottom',
				isVisible: isResizing,
			} }
			{ ...props }
		/>
	);
}
