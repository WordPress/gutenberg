/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import type { DragEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { Icon, more } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Draggable from '..';

const meta: Meta< typeof Draggable > = {
	component: Draggable,
	title: 'Components/Utilities/Draggable',
	id: 'components-draggable',
	argTypes: {
		elementId: { control: false },
		__experimentalDragComponent: { control: false },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { code: '' } },
	},
};
export default meta;

const DefaultTemplate: StoryFn< typeof Draggable > = ( args ) => {
	const [ isDragging, setDragging ] = useState( false );
	const instanceId = useInstanceId( DefaultTemplate );

	// Allow for the use of ID in the example.
	return (
		<div>
			<p
				style={ {
					padding: '1em',
					position: 'relative',
					zIndex: 1000,
					backgroundColor: 'whitesmoke',
				} }
			>
				Is Dragging? { isDragging ? 'Yes' : 'No!' }
			</p>
			<div
				style={ {
					zIndex: 100,
					position: 'relative',
				} }
			>
				<div
					id={ `draggable-example-box-${ instanceId }` }
					style={ {
						display: 'inline-flex',
						position: 'relative',
					} }
				>
					<Draggable
						{ ...args }
						elementId={ `draggable-example-box-${ instanceId }` }
					>
						{ ( { onDraggableStart, onDraggableEnd } ) => {
							const handleOnDragStart = ( event: DragEvent ) => {
								setDragging( true );
								onDraggableStart( event );
							};
							const handleOnDragEnd = ( event: DragEvent ) => {
								setDragging( false );
								onDraggableEnd( event );
							};

							return (
								<div
									onDragStart={ handleOnDragStart }
									onDragEnd={ handleOnDragEnd }
									draggable
									style={ {
										alignItems: 'center',
										display: 'flex',
										justifyContent: 'center',
										width: 100,
										height: 100,
										background: '#ddd',
									} }
								>
									<Icon icon={ more } />
								</div>
							);
						} }
					</Draggable>
				</div>
			</div>
		</div>
	);
};

export const Default: StoryFn< typeof Draggable > = DefaultTemplate.bind( {} );
Default.args = {};

/**
 * `appendToOwnerDocument` is used to append the element being dragged to the body of the owner document.
 *
 * This is useful when the element being dragged should not receive styles from its parent.
 * For example, when the element's parent sets a `z-index` value that would cause the dragged
 * element to be rendered behind other elements.
 */
export const AppendElementToOwnerDocument: StoryFn< typeof Draggable > =
	DefaultTemplate.bind( {} );
AppendElementToOwnerDocument.args = {
	appendToOwnerDocument: true,
};
