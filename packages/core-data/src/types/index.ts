/**
 * Internal dependencies
 */
import { Attachment } from './attachment';
import { Comment } from './comment';
import { MenuLocation } from './menu-location';
import { NavMenu } from './nav_menu';
import { NavMenuItem } from './nav_menu_item';
import { NavigationArea } from './navigation-area';
import { Page } from './page';
import { Plugin } from './plugin';
import { Post } from './post';
import { Settings } from './settings';
import { Sidebar } from './sidebar';
import { Taxonomy } from './taxonomy';
import { Theme } from './theme';
import { User } from './user';
import { Type } from './type';
import { Widget } from './widget';
import { WidgetType } from './widget-type';
import { WpTemplate } from './wp_template';
import { WpTemplatePart } from './wp_template_part';
import { Context, RenderedText } from './common';

export {
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

export type Updatable< T extends EntityRecord< 'edit' > > = {
	[ K in keyof T ]: T[ K ] extends RenderedText< any > ? string : T[ K ];
};

export type UpdatableEntityRecord = Updatable< EntityRecord< 'edit' > >;
export type UpdatableAttachment = Updatable< Attachment< 'edit' > >;
export type UpdatableComment = Updatable< Comment< 'edit' > >;
export type UpdatableMenuLocation = Updatable< MenuLocation< 'edit' > >;
export type UpdatableNavMenu = Updatable< NavMenu< 'edit' > >;
export type UpdatableNavMenuItem = Updatable< NavMenuItem< 'edit' > >;
export type UpdatableNavigationArea = Updatable< NavigationArea< 'edit' > >;
export type UpdatablePage = Updatable< Page< 'edit' > >;
export type UpdatablePlugin = Updatable< Plugin< 'edit' > >;
export type UpdatablePost = Updatable< Post< 'edit' > >;
export type UpdatableSettings = Updatable< Settings< 'edit' > >;
export type UpdatableSidebar = Updatable< Sidebar< 'edit' > >;
export type UpdatableTaxonomy = Updatable< Taxonomy< 'edit' > >;
export type UpdatableTheme = Updatable< Theme< 'edit' > >;
export type UpdatableUser = Updatable< User< 'edit' > >;
export type UpdatableType = Updatable< Type< 'edit' > >;
export type UpdatableWidget = Updatable< Widget< 'edit' > >;
export type UpdatableWidgetType = Updatable< WidgetType< 'edit' > >;
export type UpdatableWpTemplate = Updatable< WpTemplate< 'edit' > >;
export type UpdatableWpTemplatePart = Updatable< WpTemplatePart< 'edit' > >;
