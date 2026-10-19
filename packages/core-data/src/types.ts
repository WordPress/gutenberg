import type { ReactNode } from 'react';
import type {
	ConnectionStatus,
	SyncConfig,
	ConnectionStatusDisconnected,
	Y,
} from '@wordpress/sync';
import type { HistoryRecord } from '@wordpress/undo-manager';
import type * as ET from './entity-types';
import type { EntityActionsConfig, FieldsConfig } from './private-selectors';
import type {
	ItemId,
	QueriedDataState,
	ReceiveItemsAction,
	RemoveItemsAction,
} from './queried-data/types';
import type {
	SelectionType,
	SelectionDirection,
} from './utils/crdt-user-selections';

export type { ConnectionStatus } from '@wordpress/sync';

export type ConnectionError = NonNullable<
	ConnectionStatusDisconnected[ 'error' ]
>;

export interface AnyFunction {
	( ...args: any[] ): any;
}

/**
 * An index path from the root of the block tree to a specific block.
 *
 * For example, `[0, 1]` refers to `blocks[0].innerBlocks[1]`.
 *
 * These paths are "absolute" in that they start from the post content root
 * (not from the template root when "Show Template" mode is active).
 * Both the Yjs document and the block-editor store share the same tree
 * structure for post content blocks, so the same path can be used to
 * navigate either tree.
 */
export type AbsoluteBlockIndexPath = number[];

/**
 * Describes part of a visible selection in the editor. Namely, either a cursor
 * position within a block or a block entirely contained within a selection.
 *
 * This description covers multiple selection scenarios, each of which impacts
 * how the `attributeKey` and `offset` are set. These two parameters indicate
 * where in a RichText component the cursor sits and with which block attribute
 * that RichText component is associated.
 *
 *  - When a selection covers an entire block or covers multiple blocks, there
 *    is no associated RichText, so both of the parameters are unset.
 *
 *  - When a selection starts, ends, or is a simple position within a block,
 *    both parameters will be set accordingly.
 *
 *  - When a block is being inserted into a document, however, there are multiple
 *    stages determining which parameters are set.
 *
 *      1. A block is created in the data store, but has no appearance in the
 *         editor otherwise. Both parameters are unset.
 *
 *      2. The block has loaded into the editor and there is a RichText field,
 *         but editor focus hasn’t yet placed a browser selection inside it.
 *         Only the `attributeKey` is set.
 *
 *      3. The browser has focused into a RichText field and both parameters are set.
 *
 * Selections are thus dynamic because block creation itself loads through multiple
 * intermediate stages before someone is able to highlight, type, or modify text.
 *
 * This type is duplicated to avoid creating circular dependencies.
 * @see {import("@wordpress/block-editor/src/store/actions").WPBlockSelection}
 * @see {import("@wordpress/block-editor/src/store/selectors").WPBlockSelection}
 * @see {import("@wordpress/editor/src/store/selectors").WPBlockSelection}
 *
 * @todo Move this into a canonical types file which can be imported in separate
 *       packages without causing circular dependencies.
 */
export interface WPBlockSelection {
	/**
	 * The selection cursor (start or end) is found within this block.
	 * or this entire block is contained within a multi-block selection.
	 */
	clientId: string;

	/**
	 * When a selection cursor appears within a RichText component which
	 * maps back to a block’s attribute, e.g. a paragraph block’s `content`
	 * attribute, this will hold the attribute key for that associated
	 * block attribute.
	 *
	 * An attribute key is mostly the same as an attribute name, but in some
	 * circumstances, such as in a multiline attribute, there can be multiple
	 * RichText instances associated with a given attribute. The key will
	 * usually be the attribute name verbatim, but in these cases, an index
	 * will be appended to differentiate the multiple RichText instances
	 * associated with the array-like attribute.
	 *
	 * Technically, the `attributeKey` is the value stored in the DOM node
	 * for a RichText instance in the `data-wp-block-attribute-key` attribute.
	 * This “key” links the actual instance with the block attribute, provided
	 * by the `identifier` React prop when creating a `<RichText>` element.
	 */
	attributeKey?: string;

	/**
	 * When a selection cursor appears within a block, it can be found this
	 * many Unicode code points into the RichText component’s decoded text
	 * which is associated with the given attribute key.
	 */
	offset?: number;
}

export interface WPSelection {
	selectionEnd: WPBlockSelection;
	selectionStart: WPBlockSelection;
	initialPosition?: number | null;
}

/**
 * The position of the cursor.
 */
export type CursorPosition = {
	relativePosition: Y.RelativePosition;

	// Also store the absolute offset index of the cursor from the perspective
	// of the user who is updating the selection.
	//
	// Do not use this value directly, instead use `createAbsolutePositionFromRelativePosition()`
	// on relativePosition for the most up-to-date positioning.
	//
	// This is used because local Y.Text changes (e.g. adding or deleting a character)
	// can result in the same relative position if it is pinned to an unchanged
	// character. With both of these values as editor state, a change in perceived
	// position will always result in a redraw.
	absoluteOffset: number;

	// The sender's `WPBlockSelection.attributeKey` (e.g. `content` or
	// `body.0.cells.0.content`).
	attributeKey?: string;
};

export type SelectionNone = {
	// The user has not made a selection.
	type: SelectionType.None;
};

export type SelectionCursor = {
	// The user has a cursor position in a block with no text highlighted.
	// The block is derived on the receiver side by navigating up from the
	// resolved cursorPosition via Y.AbstractType.parent.
	type: SelectionType.Cursor;
	cursorPosition: CursorPosition;
};

export type SelectionInOneBlock = {
	// The user has highlighted text in a single block.
	// The block is derived on the receiver side by navigating up from the
	// resolved cursorStartPosition via Y.AbstractType.parent.
	type: SelectionType.SelectionInOneBlock;
	cursorStartPosition: CursorPosition;
	cursorEndPosition: CursorPosition;
	// The direction of the selection, indicating where the caret sits.
	selectionDirection?: SelectionDirection;
};

/**
 * One end of a multi-block selection. Uses SelectionCursor when the endpoint
 * lands inside a RichText field (character-level anchor) or SelectionWholeBlock
 * when the entire block is selected (block-slot anchor). The type discriminant
 * tells the receiver how to resolve this endpoint.
 */
export type SelectionEndpoint = SelectionCursor | SelectionWholeBlock;

export type SelectionInMultipleBlocks = {
	// The user's selection spans more than one block. Each endpoint is resolved
	// independently: text blocks carry a character-level CursorEndpoint while
	// blocks without a RichText field (or selected as whole blocks) carry a
	// WholeBlockEndpoint. Mixed combinations (e.g. paragraph → image) are valid.
	type: SelectionType.SelectionInMultipleBlocks;
	startEndpoint: SelectionEndpoint;
	endEndpoint: SelectionEndpoint;
	// The direction of the selection, indicating where the caret sits.
	selectionDirection?: SelectionDirection;
};

export type SelectionWholeBlock = {
	// The user has a non-text block selected, like an image block.
	// Uses a Y.RelativePosition pointing to the block in its parent Y.Array,
	// since there is no text cursor to navigate up from.
	type: SelectionType.WholeBlock;
	blockPosition: Y.RelativePosition;
};

export type SelectionState =
	| SelectionNone
	| SelectionCursor
	| SelectionInOneBlock
	| SelectionInMultipleBlocks
	| SelectionWholeBlock;

export interface ResolvedSelection {
	richTextOffset: number | null;
	localClientId: string | null;

	// Identifier of the RichText attribute within the block, e.g.:
	// - `content` on a core/paragraph block
	// - `citation` on a quote block
	// - a dot path into a nested attribute like `body.0.cells.0.content` for a
	//   core/table cell.
	// Set to `null` for WholeBlock selections.
	attributeKey: string | null;
}

/**
 * The props of `EntityProvider`.
 */
export interface EntityProviderProps {
	/**
	 * The entity kind.
	 */
	kind: string;
	/**
	 * The entity name.
	 */
	type: string;
	/**
	 * The entity ID.
	 */
	id?: number | string;
	/**
	 * Optional revision ID. When set, `useEntityProp` reads from the revision
	 * record instead of the current entity. Applies only to this entity, not
	 * to others rendered within it.
	 */
	revisionId?: number | string;
	/**
	 * The children to wrap.
	 */
	children?: ReactNode;
}

declare global {
	interface Window {
		_wpCollaborationDisabledPostTypes?: unknown;
	}
}

/**
 * A transient edit derived from the record, such as the parsed blocks.
 */
export interface TransientEditConfig {
	read: ( record: Record< string, unknown > ) => unknown;
	write: ( record: Record< string, unknown > ) => Record< string, unknown >;
}

/**
 * The fields of a record that an entity's `getTitle` reads.
 */
export interface EntityTitleRecord {
	id?: string | number;
	name?: string;
	slug?: string;
	title?: string | { rendered?: string };
}

/**
 * The configuration of an entity.
 */
export interface EntityConfig {
	name: string;
	kind: string;
	label?: string;
	key?: string | false;
	baseURL: string;
	baseURLParams?: Record< string, string >;
	plural?: string;
	rawAttributes?: ReadonlyArray< string >;
	transientEdits?: Record< string, boolean | TransientEditConfig >;
	mergedEdits?: Record< string, boolean >;
	supportsPagination?: boolean;
	getTitle?: ( record: EntityTitleRecord ) => string | undefined;
	getRevisionsUrl?: (
		parentId: string | number,
		revisionId?: string | number
	) => string;
	__unstablePrePersist?: (
		persistedRecord: Record< string, unknown > | undefined,
		edits: Record< string, unknown >
	) => Promise< Record< string, unknown > >;
	__unstable_rest_base?: string;
	revisionKey?: string;
	syncConfig?: SyncConfig;
	meta?: Record< string, unknown >;
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
			key: ItemId;
	  }
	| ( EntityActionTarget & {
			type: 'DELETE_ENTITY_RECORD_FINISH' | 'DELETE_ENTITY_RECORD_START';
			recordId: ItemId;
			error?: unknown;
	  } )
	| ( EntityActionTarget & {
			type: 'EDIT_ENTITY_RECORD';
			recordId: ItemId;
			edits: Record< string, unknown >;
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
			} )
	| ( ReceiveItemsAction & Partial< EntityActionTarget > )
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
			users: Array< ET.User< 'edit' > >;
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
			recordId: ItemId;
			error?: unknown;
			isAutosave?: boolean;
	  } )
	| { type: 'SET_COLLABORATION_SUPPORTED'; supported: boolean }
	| {
			type: 'SET_SYNC_CONNECTION_STATUS';
			kind: string;
			name: string;
			key: ItemId;
			status: ConnectionStatus;
	  };

/**
 * An entity action, with the entity's record key that the entity reducer
 * injects.
 */
export type KeyedEntityAction = Action & { key: ItemId };

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
	byId: Record< ItemId, ET.User< 'edit' > >;
	queries: Record< string, Array< ItemId > >;
}
