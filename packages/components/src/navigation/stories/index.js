/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationBackButton from '../back-button';
import NavigationGroup from '../group';
import NavigationItem from '../item';
import NavigationMenu from '../menu';
import { DefaultStory } from './default';
import { GroupStory } from './group';
import { ControlledStateStory } from './controlled-state';
import { SearchStory } from './search';
import { MoreExamplesStory } from './more-examples';
import { HideIfEmptyStory } from './hide-if-empty';
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
