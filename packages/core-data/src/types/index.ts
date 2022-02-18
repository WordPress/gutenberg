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

export type StringWhenUpdatable< T > = T & { __brand: 'UpdatableAsString' };

/**
 * Updatable<EntityRecord> is a type describing Edited Entity Records. They are like
 * regular Entity Records, but they have all the local edits applied on top of the REST API data.
 *
 * This turns certain field from an object into a string.
 *
 * Entities like Post have fields that only be rendered on the server, like title, excerpt,
 * and content. The REST API exposes both the raw markup and the rendered version of those fields.
 * For example, in the block editor, content.rendered could used as a visual preview, and
 * content.raw could be used to populate the code editor.
 *
 * When updating these rendered fields, Javascript is not be able to properly render arbitrary block
 * markup. Therefore, it stores only the raw markup without the rendered part. And since that's a string,
 * the entire field becomes a string.
 *
 * @example
 * ```ts
 * type Post< C extends Context > {
 *   title: RenderedText< C >;
 * }
 * const post = {} as Post;
 * // post.title is an object with raw and rendered properties
 *
 * const updatablePost = {} as Updatable< Post >;
 * // updatablePost.title is a string
 * ```
 */
export type Updatable< T extends EntityRecord< 'edit' > > = {
	[ K in keyof T ]: T[ K ] extends
		| RenderedText< any >
		| StringWhenUpdatable< any >
		? string
		: T[ K ];
};

export type UpdatableEntityRecord = Updatable< EntityRecord< 'edit' > >;
