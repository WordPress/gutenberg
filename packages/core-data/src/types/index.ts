/**
 * Internal dependencies
 */
import { ExtensibleAttachment, Attachment } from './attachment';
import { ExtensibleComment, Comment } from './comment';
import { ExtensibleMenuLocation, MenuLocation } from './menu-location';
import { ExtensibleNavMenu, NavMenu } from './nav-menu';
import { ExtensibleNavMenuItem, NavMenuItem } from './nav-menu-item';
import { ExtensibleNavigationArea, NavigationArea } from './navigation-area';
import { ExtensiblePage, Page } from './page';
import { ExtensiblePlugin, Plugin } from './plugin';
import { ExtensiblePost, Post } from './post';
import { ExtensibleSettings, Settings } from './settings';
import { ExtensibleSidebar, Sidebar } from './sidebar';
import { ExtensibleTaxonomy, Taxonomy } from './taxonomy';
import { ExtensibleTheme, Theme } from './theme';
import { ExtensibleUser, User } from './user';
import { ExtensibleType, Type } from './type';
import { ExtensibleWidget, Widget } from './widget';
import { ExtensibleWidgetType, WidgetType } from './widget-type';
import { ExtensibleWpTemplate, WpTemplate } from './wp-template';
import { ExtensibleWpTemplatePart, WpTemplatePart } from './wp-template-part';
import { Context, Updatable } from './helpers';

export {
	Updatable,
	Attachment,
	Comment,
	MenuLocation,
	NavMenu,
	NavMenuItem,
	NavigationArea,
	Page,
	Plugin,
	Post,
	Settings,
	Sidebar,
	Taxonomy,
	Theme,
	User,
	Type,
	Widget,
	WidgetType,
	WpTemplate,
	WpTemplatePart,
};

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

export type UpdatableEntityRecord = Updatable< EntityRecord< 'edit' > >;

export { ExtensibleAttachment } from './attachment';
export { ExtensibleComment } from './comment';
export { ExtensibleMenuLocation } from './menu-location';
export { ExtensibleNavMenu } from './nav-menu';
export { ExtensibleNavMenuItem } from './nav-menu-item';
export { ExtensibleNavigationArea } from './navigation-area';
export { ExtensiblePage } from './page';
export { ExtensiblePlugin } from './plugin';
export { ExtensiblePost } from './post';
export { ExtensibleSettings } from './settings';
export { ExtensibleSidebar } from './sidebar';
export { ExtensibleTaxonomy } from './taxonomy';
export { ExtensibleTheme } from './theme';
export { ExtensibleUser } from './user';
export { ExtensibleType } from './type';
export { ExtensibleWidget } from './widget';
export { ExtensibleWidgetType } from './widget-type';
export { ExtensibleWpTemplate } from './wp-template';
export { ExtensibleWpTemplatePart } from './wp-template-part';
