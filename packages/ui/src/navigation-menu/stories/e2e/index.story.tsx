import type { Meta } from '@storybook/react-vite';
import * as NavigationMenu from '../..';
import * as stories from '../index.story';

const meta: Meta< typeof NavigationMenu.Root > = {
	title: 'Design System/Components/NavigationMenu',
	component: NavigationMenu.Root,
};
export default meta;

export const FlatNavigation = stories.FlatNavigation;
export const FlyoutNavigation = stories.FlyoutNavigation;
export const SwitchingFlyouts = stories.SwitchingFlyouts;
export const TwoLevelNestedFlyout = stories.TwoLevelNestedFlyout;
export const ControlledRoot = stories.ControlledRoot;
export const TallFlyoutContent = stories.TallFlyoutContent;
export const RightToLeft = stories.RightToLeft;
