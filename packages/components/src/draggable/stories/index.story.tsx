/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';
import type { DragEvent } from 'react';
import { fn } from 'storybook/test';

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
	args: {
		onDragStart: fn(),
		onDragEnd: fn(),
		onDragOver: fn(),
	},
	parameters: {
		controls: { expanded: true },
		docs: {
			source: { code: '' },
			// Render in its own iframe — Storybook's docs-page wrappers
			// create transform-based containing blocks that break the
			// clone's `position: fixed` resolution.
			story: { inline: false, height: '250px' },
		},
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'May be deprecated.',
		},
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
 * `appendToOwnerDocument` appends the dragged element's clone to the owner
 * document's body instead of the element's parent, which is useful when an
 * ancestor's stacking context (e.g. its `z-index`) would otherwise place the
 * clone behind other content.
 */
export const AppendElementToOwnerDocument: StoryFn< typeof Draggable > =
	DefaultTemplate.bind( {} );
AppendElementToOwnerDocument.args = {
	appendToOwnerDocument: true,
};
