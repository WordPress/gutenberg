/**
 * External dependencies
 */
import { boolean, select, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Popover from '../';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

export default { title: 'Popover', component: Popover };

export const _default = () => {
	const show = boolean( 'Example: Show', true );
	const children = text( 'children', 'Popover Content' );
	const animate = boolean( 'animate', false );
	const focusOnMount = select(
		'focusOnMount',
		{
			firstElement: 'firstElement',
			container: 'container',
		},
		'firstElement'
	);
	const noArrow = boolean( 'noArrow', false );

	const props = {
		animate,
		children,
		focusOnMount,
		noArrow,
	};

	if ( ! show ) {
		return null;
	}

	return <Popover { ...props } />;
};

const DragExample = ( props ) => {
	const [ position, setPosition ] = useState( { x: 0, y: 0 } );
	const [ isDragging, setDragging ] = useState( false );
	const { label, content, ...restProps } = props;

	const updatePosition = ( event ) => {
		if ( ! isDragging ) {
			return false;
		}
		const { movementX, movementY } = event;
		setPosition( {
			x: position.x + movementX,
			y: position.y + movementY,
		} );
	};

	const startDragging = () => setDragging( true );
	const stopDragging = () => setDragging( false );

	useEffect( () => {
		document.addEventListener( 'mousemove', updatePosition );
		document.addEventListener( 'mouseup', stopDragging );
		return () => {
			document.removeEventListener( 'mousemove', updatePosition );
			document.removeEventListener( 'mouseup', stopDragging );
		};
	}, [ updatePosition, stopDragging ] );

	const { x, y } = position;

	return (
		<div>
			<div style={ { position: 'absolute', color: '#555' } }>
				<p>Move the gray box around.</p>
				<p>
					The{ ' ' }
					<strong style={ { background: 'pink' } }>
						pink bordered
					</strong>{ ' ' }
					element is a parent.
				</p>
				<p>
					The{ ' ' }
					<strong style={ { background: 'cyan' } }>
						cyan bordered
					</strong>{ ' ' }
					element is a sibling to <strong>Popover</strong>.
				</p>
				<p>
					<strong>Popover</strong> aligns to the content within
					parent.
				</p>
			</div>
			<div
				style={ {
					height: '100vh',
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				} }
			>
				<div
					role="presentation"
					onMouseDown={ startDragging }
					onMouseUp={ stopDragging }
					style={ {
						background: '#ddd',
						border: '2px solid pink',
						borderRadius: 4,
						padding: 10,
						userSelect: 'none',
						position: 'relative',
						top: y,
						left: x,
					} }
				>
					<div style={ { border: '2px solid cyan' } }>{ label }</div>
					<Popover { ...restProps }>{ content }</Popover>
				</div>
			</div>
		</div>
	);
};

export const positioning = () => {
	const label = text( 'Example: Label', 'Drag Me!' );
	const content = text( 'Example: Content', 'Popover' );
	const noArrow = boolean( 'noArrow', false );

	return <DragExample label={ label } content={ content } noArrow={ noArrow } />;
};
