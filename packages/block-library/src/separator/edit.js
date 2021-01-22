/**
 * External dependencies
 */
import classnames from 'classnames';
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { HorizontalRule, ResizableBox } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { withColors, useBlockProps } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';

const MIN_HEIGHT = 20;
const MIN_DOTS_HEIGHT = 30;
const MAX_HEIGHT = 500;

function SeparatorEdit( props ) {
	const { attributes, setAttributes, color, setColor, isSelected } = props;
	const { height } = attributes;
	const hasDotsStyle = attributes.className?.indexOf( 'is-style-dots' ) >= 0;
	const [ isResizing, setIsResizing ] = useState( false );

	const onResizeStart = () => {
		setIsResizing( true );
	};

	const onResizeStop = ( _event, _direction, elt ) => {
		const newHeight = Math.round( elt.clientHeight );
		setAttributes( { height: clamp( newHeight, MIN_HEIGHT, MAX_HEIGHT ) } );
		setIsResizing( false );
	};

	const blockProps = useBlockProps();

	// The block's className and styles are moved to the inner <hr> to retain
	// the different styling approaches between themes. The use of bottom
	// borders and background colors prevents using padding internally on the
	// edit component. Adjusting margins leads to losing visual indicators for
	// block selection.
	return (
		<>
			<div
				{ ...blockProps }
				className={ blockProps.className.replace(
					'wp-block-separator',
					''
				) }
			>
				<HorizontalRule
					className={ classnames( blockProps.className, {
						'has-background': color.color,
						[ color.class ]: color.class,
					} ) }
					style={ {
						backgroundColor: color.color,
						color: color.color,
					} }
				/>
				<ResizableBox
					className={ classnames(
						'block-library-separator__resize-container',
						{
							'is-selected': isSelected,
						}
					) }
					size={ { height } }
					enable={ {
						top: false,
						right: false,
						bottom: true, // Only enable bottom handle.
						left: false,
						topRight: false,
						bottomRight: false,
						bottomLeft: false,
						topLeft: false,
					} }
					minHeight={ hasDotsStyle ? MIN_DOTS_HEIGHT : MIN_HEIGHT }
					onResizeStart={ onResizeStart }
					onResizeStop={ onResizeStop }
					showHandle={ isSelected }
					__experimentalShowTooltip={ true }
					__experimentalTooltipProps={ {
						axis: 'y',
						position: 'bottom',
						isVisible: isResizing,
					} }
				/>
			</div>
			<SeparatorSettings color={ color } setColor={ setColor } />
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
