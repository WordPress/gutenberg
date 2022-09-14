/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';
/**
 * Internal dependencies
 */
import DropZone from '..';

const meta: ComponentMeta< typeof DropZone > = {
	component: DropZone,
	title: 'Components/DropZone',
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof DropZone > = ( props ) => {
	return (
		<div style={ { background: 'lightgray', padding: 16 } }>
			Drop something here
			<DropZone { ...props } />
		</div>
	);
};

export const Default = Template.bind( {} );
