/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationBackButton from '../back-button';
import NavigationGroup from '../group';
import NavigationItem from '../item';
import NavigationMenu from '../menu';
import { DefaultStory } from './default';
import { ControlledStateStory } from './controlled-state';
import { SearchStory } from './search';
import { MoreExamplesStory } from './more-examples';
import './style.css';

export default {
	title: 'Components/Navigation',
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
export const search = () => <SearchStory />;
export const moreExamples = () => <MoreExamplesStory />;
