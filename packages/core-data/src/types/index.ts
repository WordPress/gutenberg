/**
 * Internal dependencies
 */
import type { Attachment } from './attachment';
import type { Comment } from './comment';
import type { MenuLocation } from './menu-location';
import type { NavMenu } from './nav-menu';
import type { NavMenuItem } from './nav-menu-item';
import type { NavigationArea } from './navigation-area';
import type { Page } from './page';
import type { Plugin } from './plugin';
import type { Post } from './post';
import type { Settings } from './settings';
import type { Sidebar } from './sidebar';
import type { Taxonomy } from './taxonomy';
import type { Theme } from './theme';
import type { User } from './user';
import type { Type } from './type';
import type { Widget } from './widget';
import type { WidgetType } from './widget-type';
import type { WpTemplate } from './wp-template';
import type { WpTemplatePart } from './wp-template-part';
import type { Context, Updatable } from './helpers';

export type { CoreBaseEntityTypes } from './wp-base-types';

export type {
	Context,
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
