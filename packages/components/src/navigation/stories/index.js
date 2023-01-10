/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationBackButton from '../back-button';
import NavigationGroup from '../group';
import NavigationItem from '../item';
import NavigationMenu from '../menu';
import { DefaultStory } from './utils/default';
import { GroupStory } from './utils/group';
import { ControlledStateStory } from './utils/controlled-state';
import { SearchStory } from './utils/search';
import { MoreExamplesStory } from './utils/more-examples';
import { HideIfEmptyStory } from './utils/hide-if-empty';
import './style.css';

export default {
	title: 'Components (Experimental)/Navigation',
	component: Navigation,
	subcomponents: {
		NavigationBackButton,
		NavigationGroup,
		NavigationItem,
		NavigationMenu,
	},
};

export const _default = () => <DefaultStory />;
export const controlledState = () => <ControlledStateStory />;
export const groups = () => <GroupStory />;
export const search = () => <SearchStory />;
export const moreExamples = () => <MoreExamplesStory />;
export const hideIfEmpty = () => <HideIfEmptyStory />;
