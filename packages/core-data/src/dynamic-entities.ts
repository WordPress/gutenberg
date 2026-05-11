/**
 * Internal dependencies
 */
import type { GetRecordsHttpQuery, State } from './selectors';
import type * as ET from './entity-types';

export type WPEntityTypes< C extends ET.Context = 'edit' > = {
	Comment: ET.Comment< C >;
	GlobalStyles: ET.GlobalStylesRevision< C >;
	Media: ET.Attachment< C >;
	Menu: ET.NavMenu< C >;
	MenuItem: ET.NavMenuItem< C >;
	MenuLocation: ET.MenuLocation< C >;
	Plugin: ET.Plugin< C >;
	PostType: ET.Type< C >;
	Revision: ET.PostRevision< C >;
	Sidebar: ET.Sidebar< C >;
	Site: ET.Settings< C >;
	Status: ET.PostStatusObject< C >;
	Taxonomy: ET.Taxonomy< C >;
	Term: ET.Term< C >;
	Theme: ET.Theme< C >;
	UnstableBase: ET.UnstableBase< C >;
	User: ET.User< C >;
	Widget: ET.Widget< C >;
	WidgetType: ET.WidgetType< C >;
};

/**
 * A simple utility that pluralizes a string.
 * Converts:
 * - "post" to "posts"
 * - "taxonomy" to "taxonomies"
 * - "media" to "mediaItems"
 * - "status" to "statuses"
 *
 * It does not pluralize "GlobalStyles" due to lack of clarity about it at time of writing.
 */
type PluralizeEntity< T extends string > = T extends 'GlobalStyles'
	? never
	: T extends 'Media'
	? 'MediaItems'
	: T extends 'Status'
	? 'Statuses'
	: T extends `${ infer U }y`
	? `${ U }ies`
	: `${ T }s`;

/**
 * A simple utility that singularizes a string.
 *
 * Converts:
 * - "posts" to "post"
 * - "taxonomies" to "taxonomy"
 * - "mediaItems" to "media"
 * - "statuses" to "status"
 */
type SingularizeEntity< T extends string > = T extends 'MediaItems'
	? 'Media'
	: T extends 'Statuses'
	? 'Status'
	: T extends `${ infer U }ies`
	? `${ U }y`
	: T extends `${ infer U }s`
	? U
	: T;

export type SingularGetters = {
	[ Key in `get${ keyof WPEntityTypes }` ]: (
		state: State,
		id: number | string,
		query?: GetRecordsHttpQuery
	) => WPEntityTypes[ Key extends `get${ infer E }` ? E : never ] | undefined;
};

export type PluralGetters = {
	[ Key in `get${ PluralizeEntity< keyof WPEntityTypes > }` ]: (
		state: State,
		query?: GetRecordsHttpQuery
	) => Array<
		WPEntityTypes[ Key extends `get${ infer E }`
			? SingularizeEntity< E >
			: never ]
	> | null;
};

type ActionOptions = {
	throwOnError?: boolean;
};

type DeleteRecordsHttpQuery = Record< string, any >;

export type SaveActions = {
	[ Key in `save${ keyof WPEntityTypes }` ]: (
		data: Partial<
			WPEntityTypes[ Key extends `save${ infer E }` ? E : never ]
		>,
		options?: ActionOptions
	) => Promise< void >;
};

export type DeleteActions = {
	[ Key in `delete${ keyof WPEntityTypes }` ]: (
		id: number | string,
		query?: DeleteRecordsHttpQuery,
		options?: ActionOptions
	) => Promise< void >;
};

export let dynamicActions: SaveActions & DeleteActions;

export let dynamicSelectors: SingularGetters & PluralGetters;
