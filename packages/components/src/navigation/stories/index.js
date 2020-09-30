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
export const groups = () => <GroupStory />;
export const search = () => <SearchStory />;
export const moreExamples = () => <MoreExamplesStory />;

export const Test = () => {
	return (
		<Navigation>
			<NavigationMenu title="Home" menu="root" isEmpty={ false }>
				<NavigationItem
					navigateToMenu="root-sub-1"
					title="To sub 1 (hidden)"
					hideIfTargetMenuEmpty
				/>

				<NavigationItem
					navigateToMenu="root-sub-2"
					title="To sub 2"
					hideIfTargetMenuEmpty
				/>

				<NavigationItem
					navigateToMenu="root-sub-1-sub-1"
					title="To sub 1-1 (hidden)"
					hideIfTargetMenuEmpty
				/>
			</NavigationMenu>
			<NavigationMenu
				menu="root-sub-1"
				parentMenu="root"
				isEmpty={ true }
			/>
			<NavigationMenu
				menu="root-sub-2"
				parentMenu="root"
				isEmpty={ false }
			/>
			<NavigationMenu
				menu="root-sub-1-sub-1"
				parentMenu="root-sub-1"
				isEmpty={ true }
			/>
		</Navigation>
	);
};
