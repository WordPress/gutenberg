/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { __experimentalResizableBoxPopover as ResizableBoxPopover } from '@wordpress/block-editor';

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

export default function ResizableCoverPopover( {
	className,
	height,
	minHeight,
	onResize,
	onResizeStart,
	onResizeStop,
	width,
	...props
} ) {
	const [ isResizing, setIsResizing ] = useState( false );
	const dimensions = useMemo(
		() => ( { height, minHeight, width } ),
		[ minHeight, height, width ]
	);

	return (
		<ResizableBoxPopover
			__unstableRefreshSize={ dimensions }
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
