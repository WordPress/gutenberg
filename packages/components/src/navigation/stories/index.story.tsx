/**
 * External dependencies
 */
import type { Meta } from '@storybook/react';
import { fn } from 'storybook/test';

/**
 * Internal dependencies
 */
import { Navigation } from '..';
import { NavigationBackButton } from '../back-button';
import { NavigationGroup } from '../group';
import { NavigationItem } from '../item';
import { NavigationMenu } from '../menu';
import { DefaultStory } from './utils/default';
import { GroupStory } from './utils/group';
import { ControlledStateStory } from './utils/controlled-state';
import { SearchStory } from './utils/search';
import { MoreExamplesStory } from './utils/more-examples';
import { HideIfEmptyStory } from './utils/hide-if-empty';
import './style.css';

/**
 * Render a navigation list with optional groupings and hierarchy.
 *
 * This component is deprecated. Consider using `Navigator` instead.
 */
const meta: Meta< typeof Navigation > = {
	title: 'Components (Deprecated)/Navigation',
	id: 'components-navigation',
	component: Navigation,
	subcomponents: {
		NavigationBackButton,
		NavigationGroup,
		NavigationItem,
		NavigationMenu,
	},
	argTypes: {
		activeItem: { control: false },
		activeMenu: { control: false },
		children: { control: false },
		onActivateMenu: { control: false },
	},
	args: {
		onActivateMenu: fn(),
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};

export default meta;

export const _default = DefaultStory.bind( {} );
export const ControlledState = ControlledStateStory.bind( {} );
export const Groups = GroupStory.bind( {} );
export const Search = SearchStory.bind( {} );
export const MoreExamples = MoreExamplesStory.bind( {} );
export const HideIfEmpty = HideIfEmptyStory.bind( {} );
