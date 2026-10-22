/**
 * Types internal to the package, which the package root does not re-export.
 */
import type { Block } from '@wordpress/blocks';
import type { ConnectionStatus } from '@wordpress/sync';
import type { HistoryRecord } from '@wordpress/undo-manager';
import type * as ET from './entity-types';
import type { EntityActionsConfig, FieldsConfig } from './private-selectors';
import type {
	ItemId,
	QueriedDataState,
	ReceiveItemsAction,
	RemoveItemsAction,
} from './queried-data/types';
import type { EntityConfig, EntityProviderProps } from './types';

/**
 * The IDs of the provided entities, by kind and name, and their revisions
 * under `revision`: a revision ID, or a record to read from.
 */
export type EntityContextValue = Record<
	string,
	Record< string, unknown > | undefined
> & {
	revision?: Record<
		string,
		| Record< string, number | string | Record< string, unknown > >
		| undefined
	>;
};

/**
 * The props of `PrivateEntityProvider`.
 */
export interface PrivateEntityProviderProps extends EntityProviderProps {
	/**
	 * Optional record to read from.
	 */
	revision?: Record< string, unknown >;
}

/**
 * Blocks cached for an entity, with the `content` string they were parsed from.
 */
export interface ParsedBlocksCacheEntry {
	content: string;
	blocks: Array< Block >;
}

/**
 * Loads the configuration of the entities of a kind on demand.
 */
export interface EntityConfigLoader {
	kind: string;
	name?: string;
	plural?: string;
	loadEntities: () => Promise< Array< EntityConfig > >;
}

/**
 * The REST API description of a post type or a taxonomy.
 */
export interface RestTypeDescription {
	name: string;
	rest_base: string;
	rest_namespace?: string;
	taxonomies?: Array< string >;
}

/**
 * The entity an entity action targets.
 */
interface EntityActionTarget {
	kind: string;
	name: string;
}

/**
 * An action the core data reducers handle.
 */
export type Action =
	| { type: 'ADD_ENTITIES'; entities: Array< EntityConfig > }
	| {
			type: 'CLEAR_SYNC_CONNECTION_STATUS';
			kind: string;
			name: string;
			// A collection has no key.
			key: ItemId | null;
	  }
	| ( EntityActionTarget & {
			type: 'DELETE_ENTITY_RECORD_FINISH' | 'DELETE_ENTITY_RECORD_START';
			recordId: ItemId;
			error?: unknown;
	  } )
	| ( EntityActionTarget & {
			type: 'EDIT_ENTITY_RECORD';
			recordId: ItemId | undefined;
			edits: Record< string, unknown >;
			// Set by the edits the sync manager applies.
			meta?: { undo?: unknown };
			options?: Record< string, unknown >;
	  } )
	| { type: 'RECEIVE_AUTOSAVES'; postId: ItemId; autosaves: Array< unknown > }
	| { type: 'RECEIVE_BLOCK_PATTERNS'; patterns: Array< unknown > }
	| { type: 'RECEIVE_BLOCK_PATTERN_CATEGORIES'; categories: Array< unknown > }
	| { type: 'RECEIVE_CURRENT_GLOBAL_STYLES_ID'; id: number }
	| { type: 'RECEIVE_CURRENT_THEME'; currentTheme: { stylesheet: string } }
	| { type: 'RECEIVE_CURRENT_USER'; currentUser: ET.User< 'view' > }
	| { type: 'RECEIVE_DEFAULT_TEMPLATE'; query: unknown; templateId: string }
	| { type: 'RECEIVE_EDITOR_ASSETS'; assets: Record< string, unknown > }
	| { type: 'RECEIVE_EDITOR_SETTINGS'; settings: Record< string, unknown > }
	| { type: 'RECEIVE_EMBED_PREVIEW'; url: string; preview: unknown }
	| {
			type: 'RECEIVE_ENTITY_ACTIONS_CONFIG';
			kind: string;
			name: string;
			config: EntityActionsConfig;
	  }
	| {
			type: 'RECEIVE_FIELDS_CONFIG';
			kind: string;
			name: string;
			config: FieldsConfig;
	  }
	| ( Omit< ReceiveItemsAction, 'type' > &
			EntityActionTarget & {
				type: 'RECEIVE_ITEM_REVISIONS';
				recordKey?: ItemId;
				invalidateCache?: boolean | null;
			} )
	| ( ReceiveItemsAction &
			Partial< EntityActionTarget > & {
				invalidateCache?: boolean | null;
			} )
	| { type: 'RECEIVE_NAVIGATION_FALLBACK_ID'; fallbackId: ItemId | null }
	| {
			type: 'RECEIVE_REGISTERED_POST_META';
			postType: string;
			registeredPostMeta: Record< string, unknown >;
	  }
	| {
			type: 'RECEIVE_THEME_GLOBAL_STYLE_REVISIONS';
			currentId: number;
			revisions: Array< object >;
	  }
	| {
			type: 'RECEIVE_THEME_GLOBAL_STYLE_VARIATIONS';
			stylesheet: string;
			variations: unknown;
	  }
	| {
			type: 'RECEIVE_THEME_GLOBAL_STYLES';
			stylesheet: string;
			globalStyles: object;
	  }
	| {
			type: 'RECEIVE_USER_PATTERN_CATEGORIES';
			patternCategories: Array< unknown >;
	  }
	| { type: 'RECEIVE_USER_PERMISSION'; key: string; isAllowed: boolean }
	| {
			type: 'RECEIVE_USER_PERMISSIONS';
			permissions: Record< string, boolean >;
	  }
	| {
			type: 'RECEIVE_USER_QUERY';
			queryID: string;
			users: Array< ET.User< 'view' > >;
	  }
	| {
			type: 'RECEIVE_VIEW_CONFIG';
			kind: string;
			name: string;
			config: Record< string, unknown >;
	  }
	| { type: 'RECORD_SYNC_UNDO_LEVEL' }
	| { type: 'REDO' | 'UNDO'; record: HistoryRecord }
	| RemoveItemsAction
	| ( EntityActionTarget & {
			type: 'SAVE_ENTITY_RECORD_FINISH' | 'SAVE_ENTITY_RECORD_START';
			recordId: ItemId | undefined;
			error?: unknown;
			isAutosave?: boolean;
	  } )
	| { type: 'SET_COLLABORATION_SUPPORTED'; supported: boolean }
	| {
			type: 'SET_SYNC_CONNECTION_STATUS';
			kind: string;
			name: string;
			// A collection has no key.
			key: ItemId | null;
			status: ConnectionStatus;
	  };

/**
 * An entity action, with the entity's record key that the entity reducer
 * injects. An action's own `key` overrides the injected one.
 */
export type KeyedEntityAction = Action extends infer A
	? A extends { key: unknown }
		? A
		: A & { key: ItemId }
	: never;

/**
 * The state of the records of one entity.
 */
export interface EntityRecordsState {
	queriedData: QueriedDataState;
	edits: Record< ItemId, Record< string, unknown > >;
	saving: Record<
		ItemId,
		{ pending: boolean; error?: unknown; isAutosave?: boolean }
	>;
	deleting: Record< ItemId, { pending: boolean; error?: unknown } >;
	revisions: Record< ItemId, QueriedDataState >;
}

/**
 * The state of the entities: their configs, records and reducer.
 */
export interface EntitiesState {
	config?: Array< EntityConfig >;
	records?: Record< string, Record< string, EntityRecordsState > >;
	reducer?: (
		state:
			Record< string, Record< string, EntityRecordsState > > | undefined,
		action: Action
	) => Record< string, Record< string, EntityRecordsState > >;
}

/**
 * The users state: the users by ID, and the IDs each query lists.
 */
export interface UsersState {
	byId: Record< ItemId, ET.User< 'view' > >;
	queries: Record< string, Array< ItemId > >;
}
