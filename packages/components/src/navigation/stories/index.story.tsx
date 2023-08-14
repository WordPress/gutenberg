/**
 * External dependencies
 */
import type { ComponentMeta } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Navigation } from '..';
import { DefaultStory } from './utils/default';
import { GroupStory } from './utils/group';
import { ControlledStateStory } from './utils/controlled-state';
import { SearchStory } from './utils/search';
import { MoreExamplesStory } from './utils/more-examples';
import { HideIfEmptyStory } from './utils/hide-if-empty';
import './style.css';

const meta: ComponentMeta< typeof Navigation > = {
	title: 'Components (Experimental)/Navigation',
	component: Navigation,
	argTypes: {
		activeItem: { control: { type: null } },
		activeMenu: { control: { type: null } },
		children: { control: { type: null } },
		onActivateMenu: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};

export default meta;

export const _default = DefaultStory.bind( {} );
export const controlledState = ControlledStateStory.bind( {} );
export const groups = GroupStory.bind( {} );
export const search = SearchStory.bind( {} );
export const moreExamples = MoreExamplesStory.bind( {} );
export const hideIfEmpty = HideIfEmptyStory.bind( {} );
