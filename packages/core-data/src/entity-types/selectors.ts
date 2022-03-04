/**
 * Internal dependencies
 */
import type {
	Attachment,
	Context,
	EntityQuery,
	Updatable,
	User,
} from './index';
import {
	DefaultContextOf,
	KeyOf,
	Kind,
	KindOf,
	Name,
	NameOf,
	RecordOf,
} from './entities';

type State = any;

export type isRequestingEmbedPreview = ( state: State, url: string ) => boolean;
export type getAuthors = (
	state: State,
	query: Record< string, unknown >
) => Array< User >;

export type getEntityRecord = <
	R extends RecordOf< K, N >,
	C extends Context = DefaultContextOf< R >,
	K extends Kind = KindOf< R >,
	N extends Name = NameOf< R >,
	Q extends {
		/**
		 * The requested fields. If specified, the REST API will remove from the response
		 * any fields not on that list.
		 */
		_fields?: string[];
	} = {}
>(
	state: State,
	kind: K,
	name: N,
	key: KeyOf< R >,
	query?: Q & {
		context?: C;
	}
) =>
	| ( Q[ '_fields' ] extends string[]
			? Partial< RecordOf< K, N, C > >
			: RecordOf< K, N, C > )
	| null
	| undefined;

export type getEditedEntityRecord = <
	R extends RecordOf< K, N >,
	K extends Kind = KindOf< R >,
	N extends Name = NameOf< R >
>(
	state: State,
	kind: K,
	name: N,
	recordId: KeyOf< R >
) => Updatable< RecordOf< K, N, DefaultContextOf< R > > > | null | undefined;

export type getRawEntityRecord = getEditedEntityRecord;
