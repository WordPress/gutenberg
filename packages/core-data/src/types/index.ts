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

export type UpdatableEntityRecord = UpdatableRecord< EntityRecord< 'edit' > >;
export type UpdatableRecord< T extends EntityRecord< 'edit' > > = {
	[ K in keyof T ]: T[ K ] extends RenderedText< any > ? string : T[ K ];
};

export type UpdatableAttachment = UpdatableRecord< Attachment< 'edit' > >;
export type UpdatableComment = UpdatableRecord< Comment< 'edit' > >;
export type UpdatableMenuLocation = UpdatableRecord< MenuLocation< 'edit' > >;
export type UpdatableNavMenu = UpdatableRecord< NavMenu< 'edit' > >;
export type UpdatableNavMenuItem = UpdatableRecord< NavMenuItem< 'edit' > >;
export type UpdatableNavigationArea = UpdatableRecord<
	NavigationArea< 'edit' >
>;
export type UpdatablePage = UpdatableRecord< Page< 'edit' > >;
export type UpdatablePlugin = UpdatableRecord< Plugin< 'edit' > >;
export type UpdatablePost = UpdatableRecord< Post< 'edit' > >;
export type UpdatableSettings = UpdatableRecord< Settings< 'edit' > >;
export type UpdatableSidebar = UpdatableRecord< Sidebar< 'edit' > >;
export type UpdatableTaxonomy = UpdatableRecord< Taxonomy< 'edit' > >;
export type UpdatableTheme = UpdatableRecord< Theme< 'edit' > >;
export type UpdatableUser = UpdatableRecord< User< 'edit' > >;
export type UpdatableType = UpdatableRecord< Type< 'edit' > >;
export type UpdatableWidget = UpdatableRecord< Widget< 'edit' > >;
export type UpdatableWidgetType = UpdatableRecord< WidgetType< 'edit' > >;
export type UpdatableWpTemplate = UpdatableRecord< WpTemplate< 'edit' > >;
export type UpdatableWpTemplatePart = UpdatableRecord<
	WpTemplatePart< 'edit' >
>;
