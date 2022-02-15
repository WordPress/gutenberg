/**
 * Internal dependencies
 */
import { Attachment, AttachmentWithEdits } from './attachment';
import { Comment, CommentWithEdits } from './comment';
import { MenuLocation, MenuLocationWithEdits } from './menu-location';
import { NavMenu, NavMenuWithEdits } from './nav_menu';
import { NavMenuItem, NavMenuItemWithEdits } from './nav_menu_item';
import { NavigationArea, NavigationAreaWithEdits } from './navigation-area';
import { Page, PageWithEdits } from './page';
import { Plugin, PluginWithEdits } from './plugin';
import { Post, PostWithEdits } from './post';
import { Settings, SettingsWithEdits } from './settings';
import { Sidebar, SidebarWithEdits } from './sidebar';
import { Taxonomy, TaxonomyWithEdits } from './taxonomy';
import { Theme, ThemeWithEdits } from './theme';
import { User, UserWithEdits } from './user';
import { Type, TypeWithEdits } from './type';
import { Widget, WidgetWithEdits } from './widget';
import { WidgetType, WidgetTypeWithEdits } from './widget-type';
import { WpTemplate, WpTemplateWithEdits } from './wp_template';
import { WpTemplatePart, WpTemplatePartWithEdits } from './wp_template_part';

export type EntityRecord =
	| Attachment
	| Comment
	| MenuLocation
	| NavMenu
	| NavMenuItem
	| NavigationArea
	| Page
	| Plugin
	| Post
	| Settings
	| Sidebar
	| Taxonomy
	| Theme
	| Type
	| User
	| Widget
	| WidgetType
	| WpTemplate
	| WpTemplatePart;

export type EntityRecordWithEdits =
	| AttachmentWithEdits
	| CommentWithEdits
	| MenuLocationWithEdits
	| NavMenuWithEdits
	| NavMenuItemWithEdits
	| NavigationAreaWithEdits
	| PageWithEdits
	| PluginWithEdits
	| PostWithEdits
	| SettingsWithEdits
	| SidebarWithEdits
	| TaxonomyWithEdits
	| ThemeWithEdits
	| TypeWithEdits
	| UserWithEdits
	| WidgetWithEdits
	| WidgetTypeWithEdits
	| WpTemplateWithEdits
	| WpTemplatePartWithEdits;
