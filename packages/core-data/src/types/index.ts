/**
 * Internal dependencies
 */
import { Attachment, UpdatableAttachment } from './attachment';
import { Comment, UpdatableComment } from './comment';
import { MenuLocation, UpdatableMenuLocation } from './menu-location';
import { NavMenu, UpdatableNavMenu } from './nav_menu';
import { NavMenuItem, UpdatableNavMenuItem } from './nav_menu_item';
import { NavigationArea, UpdatableNavigationArea } from './navigation-area';
import { Page, UpdatablePage } from './page';
import { Plugin, UpdatablePlugin } from './plugin';
import { Post, UpdatablePost } from './post';
import { Settings, UpdatableSettings } from './settings';
import { Sidebar, UpdatableSidebar } from './sidebar';
import { Taxonomy, UpdatableTaxonomy } from './taxonomy';
import { Theme, UpdatableTheme } from './theme';
import { User, UpdatableUser } from './user';
import { Type, UpdatableType } from './type';
import { Widget, UpdatableWidget } from './widget';
import { WidgetType, UpdatableWidgetType } from './widget-type';
import { WpTemplate, UpdatableWpTemplate } from './wp_template';
import { WpTemplatePart, UpdatableWpTemplatePart } from './wp_template_part';
import { Context } from './common';

export type EntityRecord< C extends Context > =
	| Attachment< C >
	| Comment< C >
	| MenuLocation< C >
	| NavMenu< C >
	| NavMenuItem< C >
	| NavigationArea< C >
	| Page< C >
	| Plugin< C >
	| Post< C >
	| Settings< C >
	| Sidebar< C >
	| Taxonomy< C >
	| Theme< C >
	| Type< C >
	| User< C >
	| Widget< C >
	| WidgetType< C >
	| WpTemplate< C >
	| WpTemplatePart< C >;

export type UpdatableEntityRecord =
	| UpdatableAttachment
	| UpdatableComment
	| UpdatableMenuLocation
	| UpdatableNavMenu
	| UpdatableNavMenuItem
	| UpdatableNavigationArea
	| UpdatablePage
	| UpdatablePlugin
	| UpdatablePost
	| UpdatableSettings
	| UpdatableSidebar
	| UpdatableTaxonomy
	| UpdatableTheme
	| UpdatableType
	| UpdatableUser
	| UpdatableWidget
	| UpdatableWidgetType
	| UpdatableWpTemplate
	| UpdatableWpTemplatePart;
