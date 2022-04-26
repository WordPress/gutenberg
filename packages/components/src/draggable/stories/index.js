/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, more } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Draggable from '../';

export default { title: 'Components/Draggable', component: Draggable };

const Box = ( props ) => {
	return (
		<div
			{ ...props }
			style={ {
				alignItems: 'center',
				display: 'flex',
				justifyContent: 'center',
				width: 100,
				height: 100,
				background: '#ddd',
			} }
		/>
	);
};

const DraggalbeExample = () => {
	const [ isDragging, setDragging ] = useState( false );

	// Allow for the use of ID in the example.
	/* eslint-disable no-restricted-syntax */
	return (
		<div>
			<p>Is Dragging? { isDragging ? 'Yes' : 'No' }</p>
			<div
				id="draggable-example-box"
				style={ { display: 'inline-flex' } }
			>
				<Draggable elementId="draggable-example-box">
					{ ( { onDraggableStart, onDraggableEnd } ) => {
						const handleOnDragStart = ( event ) => {
							setDragging( true );
							onDraggableStart( event );
						};
						const handleOnDragEnd = ( event ) => {
							setDragging( false );
							onDraggableEnd( event );
						};

						return (
							<Box
								onDragStart={ handleOnDragStart }
								onDragEnd={ handleOnDragEnd }
								draggable
							>
								<Icon icon={ more } />
							</Box>
						);
					} }
				</Draggable>
			</div>
		</div>
	);
	/* eslint-enable no-restricted-syntax */
};

export const _default = () => {
	return <DraggalbeExample />;
};
