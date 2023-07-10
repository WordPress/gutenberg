/**
 * Internal dependencies
 */
import type { Status } from './constants';

export interface EntityRecordsResolution< RecordType > {
	/** The requested entity record */
	records: RecordType[] | null;

	/**
	 * Is the record still being resolved?
	 */
	isResolving: boolean;

	/**
	 * Is the record resolved by now?
	 */
	hasResolved: boolean;

	/** Resolution status */
	status: Status;
}

export interface EntityRecordResolution< RecordType > {
	/** The requested entity record */
	record: RecordType | null;

	/** The edited entity record */
	editedRecord: Partial< RecordType >;

	/** Apply local (in-browser) edits to the edited entity record */
	edit: ( diff: Partial< RecordType > ) => void;

	/** Persist the edits to the server */
	save: () => Promise< void >;

	/**
	 * Is the record still being resolved?
	 */
	isResolving: boolean;

	/**
	 * Does the record have any local edits?
	 */
	hasEdits: boolean;

	/**
	 * Is the record resolved by now?
	 */
	hasResolved: boolean;

	/** Resolution status */
	status: Status;
}

export interface Options {
	/**
	 * Whether to run the query or short-circuit and return null.
	 *
	 * @default true
	 */
	enabled: boolean;
}

interface QuerySelectResponse< Data > {
	/** the requested selector return value */
	data: Data;

	/** is the record still being resolved? Via the `getIsResolving` meta-selector */
	isResolving: boolean;

	/** was the resolution started? Via the `hasStartedResolution` meta-selector */
	hasStarted: boolean;

	/** has the resolution finished? Via the `hasFinishedResolution` meta-selector. */
	hasResolved: boolean;
}

export interface EnrichedSelectors {
	< Selectors extends Record< string, ( ...args: any[] ) => any > >(
		selectors: Selectors
	): {
		[ Selector in keyof Selectors ]: (
			...args: Parameters< Selectors[ Selector ] >
		) => QuerySelectResponse< ReturnType< Selectors[ Selector ] > >;
	};
}

interface GlobalResourcePermissionsResolution {
	/** Can the current user create new resources of this type? */
	canCreate: boolean;
}
interface SpecificResourcePermissionsResolution {
	/** Can the current user update resources of this type? */
	canUpdate: boolean;
	/** Can the current user delete resources of this type? */
	canDelete: boolean;
}

interface ResolutionDetails {
	/** Resolution status */
	status: Status;
	/**
	 * Is the data still being resolved?
	 */
	isResolving: boolean;
}

/**
 * Is the data resolved by now?
 */
export type HasResolved = boolean;

export type ResourcePermissionsResolution< IdType > = [
	HasResolved,
	ResolutionDetails &
		GlobalResourcePermissionsResolution &
		( IdType extends void ? SpecificResourcePermissionsResolution : {} )
];
