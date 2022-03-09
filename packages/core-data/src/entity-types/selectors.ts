/**
 * Internal dependencies
 */
import type { Context, Theme, Updatable, User, WpTemplate } from './index';
import type {
	DefaultContextOf,
	EntityDeclaration,
	EntityOf,
	KeyOf,
	Kind,
	KindOf,
	Name,
	NameOf,
	RecordOf,
} from './entities';

type State = any;

/**
 * Types for all the selectors in core-data.
 *
 * Occasionally the return type is any – this reflects the historical JSdoc annotations.
 * Ideally, all instances of `any` will turn into appropriate types over time.
 */
export type isRequestingEmbedPreview = ( state: State, url: string ) => boolean;
export type getAuthors = (
	state: State,
	query: Record< string, unknown >
) => User[];

export type getCurrentUser = ( state: State ) => User;
export type getUserQueryResults = ( state: State, queryID: string ) => User[];
export type getEntitiesByKind = (
	state: State,
	queryID: string
) => EntityDeclaration[];

export type getEntity = (
	state: State,
	kind: Kind,
	name: Name
) => EntityDeclaration | undefined;

export type getEntityRecord = <
	R extends RecordOf< K, N >,
	C extends Context = DefaultContextOf< R >,
	K extends Kind = KindOf< R >,
	N extends Name = NameOf< R >,
	/**
	 * The requested fields. If specified, the REST API will remove from the response
	 * any fields not on that list.
	 */
	Fields extends string[] | undefined = undefined
>(
	state: State,
	kind: K,
	name: N,
	key: KeyOf< R >,
	query?: {
		context?: C;
		_fields?: Fields;
	}
) =>
	| ( Fields extends undefined
			? RecordOf< K, N, C >
			: Partial< RecordOf< K, N, C > > )
	| null
	| undefined;

export type __experimentalGetEntityRecordNoResolver = getEntityRecord;

export type getRawEntityRecord = getEditedEntityRecord;

export type hasEntityRecords = <
	R extends RecordOf< K, N >,
	C extends Context = DefaultContextOf< R >,
	K extends Kind = KindOf< R >,
	N extends Name = NameOf< R >
>(
	state: State,
	kind: K,
	name: N,
	query?: {
		context?: C;
	}
) => boolean;

export type getEntityRecords = <
	R extends RecordOf< K, N >,
	C extends Context = DefaultContextOf< R >,
	K extends Kind = KindOf< R >,
	N extends Name = NameOf< R >,
	/**
	 * The requested fields. If specified, the REST API will remove from the response
	 * any fields not on that list.
	 */
	Fields extends string[] | undefined = undefined
>(
	state: State,
	kind: K,
	name: N,
	query?: {
		context?: C;
		_fields?: Fields;
	}
) =>
	| Array<
			Fields extends undefined
				? RecordOf< K, N, C >
				: Partial< RecordOf< K, N, C > >
	  >
	| null
	| undefined;

export type __experimentalGetDirtyEntityRecords = <
	K extends Kind,
	N extends Name
>(
	state: State
) => { title: string; key: KeyOf< K, N >; name: N; kind: K }[];

export type __experimentalGetEntitiesBeingSaved = __experimentalGetDirtyEntityRecords;

export type getEntityRecordEdits = <
	R extends RecordOf< K, N >,
	K extends Kind = KindOf< R >,
	N extends Name = NameOf< R >
>(
	state: State,
	kind: K,
	name: N,
	key: KeyOf< R >
) => Partial< RecordOf< K, N > >[] | undefined;

export type getEntityRecordNonTransientEdits = getEntityRecordEdits;

type recordToBoolean = <
	R extends RecordOf< K, N >,
	K extends Kind = KindOf< R >,
	N extends Name = NameOf< R >
>(
	state: State,
	kind: K,
	name: N,
	key: KeyOf< R >
) => boolean;

export type hasEditsForEntityRecord = recordToBoolean;

export type getEditedEntityRecord = <
	R extends RecordOf< K, N >,
	K extends Kind = KindOf< R >,
	N extends Name = NameOf< R >
>(
	state: State,
	kind: K,
	name: N,
	recordId: KeyOf< R >
) => Updatable< RecordOf< K, N > > | null | undefined;

export type isAutosavingEntityRecord = recordToBoolean;
export type isSavingEntityRecord = recordToBoolean;
export type isDeletingEntityRecord = recordToBoolean;

export type getLastEntitySaveError = <
	R extends RecordOf< K, N >,
	K extends Kind = KindOf< R >,
	N extends Name = NameOf< R >
>(
	state: State,
	kind: K,
	name: N,
	key: KeyOf< R >
) => any;

export type getLastEntityDeleteError = getLastEntitySaveError;

export type getCurrentUndoOffset = ( state: State ) => number;
export type getUndoEdit = ( state: State ) => any;
export type getRedoEdit = ( state: State ) => any;
export type hasUndo = ( state: State ) => boolean;
export type hasRedo = ( state: State ) => boolean;
export type getCurrentTheme = ( state: State ) => Theme;
export type __experimentalGetCurrentGlobalStylesId = ( state: State ) => string;
export type getThemeSupports = ( state: State ) => any;
export type getEmbedPreview = ( state: State, url: string ) => any;
export type isPreviewEmbedFallback = ( state: State, url: string ) => boolean;
export type canUser = (
	state: State,
	action: string,
	resource: string,
	id?: string
) => boolean | undefined;
export type canUserEditEntityRecord = recordToBoolean;

export type getAutosaves = < N extends EntityOf< 'postType', any >[ 'name' ] >(
	state: State,
	postType: N,
	postId: number
) => Partial< RecordOf< 'postType', N > >[] | undefined;

export type getAutosave = < N extends EntityOf< 'postType', any >[ 'name' ] >(
	state: State,
	postType: N,
	postId: number,
	authorId: number
) => Partial< RecordOf< 'postType', N > > | undefined;

export type hasFetchedAutosaves = <
	N extends EntityOf< 'postType', any >[ 'name' ]
>(
	state: State,
	postType: N,
	postId: number
) => boolean;

export type getReferenceByDistinctEdits = ( state: State ) => any;
export type __experimentalGetTemplateForLink = (
	state: State,
	link: string
) => WpTemplate | null;

export type __experimentalGetCurrentThemeBaseGlobalStyles = (
	state: State,
	link: string
) => any | null;

export type __experimentalGetCurrentThemeGlobalStylesVariations = (
	state: State,
	link: string
) => any | null;
