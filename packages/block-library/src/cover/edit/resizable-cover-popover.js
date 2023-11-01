/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

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

const { ResizableBoxPopover } = unlock( blockEditorPrivateApis );

export default function ResizableCoverPopover( {
	className,
	height,
	minHeight,
	onResize,
	onResizeStart,
	onResizeStop,
	showHandle,
	size,
	width,
	...props
} ) {
	const [ isResizing, setIsResizing ] = useState( false );
	const dimensions = useMemo(
		() => ( { height, minHeight, width } ),
		[ minHeight, height, width ]
	);

	const resizableBoxProps = {
		className: classnames( className, { 'is-resizing': isResizing } ),
		enable: RESIZABLE_BOX_ENABLE_OPTION,
		onResizeStart: ( _event, _direction, elt ) => {
			onResizeStart( elt.clientHeight );
			onResize( elt.clientHeight );
		},
		onResize: ( _event, _direction, elt ) => {
			onResize( elt.clientHeight );
			if ( ! isResizing ) {
				setIsResizing( true );
			}
		},
		onResizeStop: ( _event, _direction, elt ) => {
			onResizeStop( elt.clientHeight );
			setIsResizing( false );
		},
		showHandle,
		size,
		__experimentalShowTooltip: true,
		__experimentalTooltipProps: {
			axis: 'y',
			position: 'bottom',
			isVisible: isResizing,
		},
	};

	return (
		<ResizableBoxPopover
			className="block-library-cover__resizable-box-popover"
			__unstableRefreshSize={ dimensions }
			resizableBoxProps={ resizableBoxProps }
			{ ...props }
		/>
	);
}
