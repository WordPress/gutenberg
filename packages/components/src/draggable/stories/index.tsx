/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import type { DragEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, more } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Draggable from '..';

const meta: ComponentMeta< typeof Draggable > = {
	component: Draggable,
	title: 'Components/Draggable',
	argTypes: {
		elementId: { control: { type: null } },
		__experimentalDragComponent: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { code: '' } },
	},
};
export default meta;

const DefaultTemplate: ComponentStory< typeof Draggable > = ( args ) => {
	const [ isDragging, setDragging ] = useState( false );

	// Allow for the use of ID in the example.
	return (
		<div>
			<p>Is Dragging? { isDragging ? 'Yes' : 'No!' }</p>
			<div
				/* eslint-disable no-restricted-syntax, eslint-comments/disable-enable-pair */
				id="draggable-example-box"
				style={ { display: 'inline-flex' } }
			>
				<Draggable { ...args } elementId="draggable-example-box">
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
	);
};

export const Default: ComponentStory< typeof Draggable > = DefaultTemplate.bind(
	{}
);
Default.args = {};
