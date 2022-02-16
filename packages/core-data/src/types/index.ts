/**
 * Internal dependencies
 */
import { Attachment, EditedAttachment } from './attachment';
import { Comment, EditedComment } from './comment';
import { MenuLocation, EditedMenuLocation } from './menu-location';
import { NavMenu, EditedNavMenu } from './nav_menu';
import { NavMenuItem, EditedNavMenuItem } from './nav_menu_item';
import { NavigationArea, EditedNavigationArea } from './navigation-area';
import { Page, EditedPage } from './page';
import { Plugin, EditedPlugin } from './plugin';
import { Post, EditedPost } from './post';
import { Settings, EditedSettings } from './settings';
import { Sidebar, EditedSidebar } from './sidebar';
import { Taxonomy, EditedTaxonomy } from './taxonomy';
import { Theme, EditedTheme } from './theme';
import { User, EditedUser } from './user';
import { Type, EditedType } from './type';
import { Widget, EditedWidget } from './widget';
import { WidgetType, EditedWidgetType } from './widget-type';
import { WpTemplate, EditedWpTemplate } from './wp_template';
import { WpTemplatePart, EditedWpTemplatePart } from './wp_template_part';
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

export type EditedEntityRecord =
	| EditedAttachment
	| EditedComment
	| EditedMenuLocation
	| EditedNavMenu
	| EditedNavMenuItem
	| EditedNavigationArea
	| EditedPage
	| EditedPlugin
	| EditedPost
	| EditedSettings
	| EditedSidebar
	| EditedTaxonomy
	| EditedTheme
	| EditedType
	| EditedUser
	| EditedWidget
	| EditedWidgetType
	| EditedWpTemplate
	| EditedWpTemplatePart;
