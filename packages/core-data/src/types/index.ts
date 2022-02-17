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
import { Context, RawField } from './common';

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

export type UpdatableRecord< T extends EntityRecord< any > > = {
	[ K in keyof T ]: T[ K ] extends RawField< any > ? string : T[ K ];
};
