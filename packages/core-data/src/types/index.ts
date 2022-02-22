/**
 * Internal dependencies
 */
import type { ExtensibleAttachment, Attachment } from './attachment';
import type { ExtensibleComment, Comment } from './comment';
import type { ExtensibleMenuLocation, MenuLocation } from './menu-location';
import type { ExtensibleNavMenu, NavMenu } from './nav-menu';
import type { ExtensibleNavMenuItem, NavMenuItem } from './nav-menu-item';
import type {
	ExtensibleNavigationArea,
	NavigationArea,
} from './navigation-area';
import type { ExtensiblePage, Page } from './page';
import type { ExtensiblePlugin, Plugin } from './plugin';
import type { ExtensiblePost, Post } from './post';
import type { ExtensibleSettings, Settings } from './settings';
import type { ExtensibleSidebar, Sidebar } from './sidebar';
import type { ExtensibleTaxonomy, Taxonomy } from './taxonomy';
import type { ExtensibleTheme, Theme } from './theme';
import type { ExtensibleUser, User } from './user';
import type { ExtensibleType, Type } from './type';
import type { ExtensibleWidget, Widget } from './widget';
import type { ExtensibleWidgetType, WidgetType } from './widget-type';
import type { ExtensibleWpTemplate, WpTemplate } from './wp-template';
import type {
	ExtensibleWpTemplatePart,
	WpTemplatePart,
} from './wp-template-part';
import type { Context, Updatable } from './helpers';

export type {
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

export type { ExtensibleAttachment } from './attachment';
export type { ExtensibleComment } from './comment';
export type { ExtensibleMenuLocation } from './menu-location';
export type { ExtensibleNavMenu } from './nav-menu';
export type { ExtensibleNavMenuItem } from './nav-menu-item';
export type { ExtensibleNavigationArea } from './navigation-area';
export type { ExtensiblePage } from './page';
export type { ExtensiblePlugin } from './plugin';
export type { ExtensiblePost } from './post';
export type { ExtensibleSettings } from './settings';
export type { ExtensibleSidebar } from './sidebar';
export type { ExtensibleTaxonomy } from './taxonomy';
export type { ExtensibleTheme } from './theme';
export type { ExtensibleUser } from './user';
export type { ExtensibleType } from './type';
export type { ExtensibleWidget } from './widget';
export type { ExtensibleWidgetType } from './widget-type';
export type { ExtensibleWpTemplate } from './wp-template';
export type { ExtensibleWpTemplatePart } from './wp-template-part';
