import { useCallback, useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../name';
import type { store as coreStore } from '../';
import { EntityContext } from '../entity-context';
import useEntityId from './use-entity-id';

// The same fields the editor loads revisions with, so that they are read from
// the store rather than fetched again. `content` is the exception: the whole
// field would pull `content.rendered` too.
// A stable reference, because `getRevision` memoizes on the query's identity.
const REVISION_QUERY = {
	context: 'edit',
	_fields: 'id,date,author,meta,title,excerpt,content.raw',
};

/**
 * Hook that returns the value and a setter for the
 * specified property of the nearest provided
 * entity of the specified type.
 *
 * @param kind The entity kind.
 * @param name The entity name.
 * @param prop The property name.
 * @param _id  An entity ID to use instead of the context-provided one.
 *
 * @return An array where the first item is the
 *         property value, the second is the
 *         setter and the third is the full value
 *         object from REST API containing more
 *         information like `raw`, `rendered` and
 *         `protected` props.
 */
export default function useEntityProp< Value = unknown >(
	kind: string,
	name: string,
	prop: string,
	_id?: number | string
): [ Value, ( newValue: Value ) => void, unknown ] {
	const providerId = useEntityId( kind, name );
	const id = _id ?? providerId;
	const context = useContext( EntityContext );
	// A revision applies only to the record it was provided for. The ID can be
	// given as a string or a number, so compare the two loosely.
	const providedRevision =
		String( id ) === String( providerId )
			? context?.revision?.[ kind ]?.[ name ]
			: undefined;
	const revisionRecord =
		// A provided revision record is an object, a revision ID is not.
		typeof providedRevision === 'object'
			? ( providedRevision as Record< string, unknown > | null )
			: undefined;
	// Otherwise the provided revision is its ID.
	const revisionId = revisionRecord
		? undefined
		: ( providedRevision as number | undefined );
	const isRevision = !! ( revisionRecord || revisionId );

	const { value, fullValue } = useSelect(
		( select ) => {
			if ( revisionRecord ? prop in revisionRecord : revisionId ) {
				const revision =
					revisionRecord ??
					// The store is selected by name, which carries no store types.
					select(
						STORE_NAME as unknown as typeof coreStore
					).getRevision(
						kind,
						name,
						// A revision is provided for a record, so its ID is set.
						id as string | number,
						// Set, as the condition above checks.
						revisionId as number,
						REVISION_QUERY
					);
				// Fields are read by their name.
				const propValue = (
					revision as Record< string, unknown > | undefined
				 )?.[ prop ];
				if ( propValue === undefined ) {
					return {};
				}
				// Raw attributes hold their value under `raw`, like the edited
				// record does. Any other field is the value itself.
				const isRawAttribute =
					propValue !== null &&
					typeof propValue === 'object' &&
					'raw' in propValue;
				return {
					value: isRawAttribute ? propValue.raw : propValue,
					fullValue: propValue,
				};
			}

			const { getEntityRecord, getEditedEntityRecord } =
				// The store is selected by name, which carries no store types.
				select( STORE_NAME as unknown as typeof coreStore );
			const record = getEntityRecord( kind, name, id ); // Trigger resolver.
			const editedRecord = getEditedEntityRecord( kind, name, id );
			return record && editedRecord
				? {
						// Fields are read by their name.
						value: ( editedRecord as Record< string, unknown > )[
							prop
						],
						// Fields are read by their name.
						fullValue: ( record as Record< string, unknown > )[
							prop
						],
					}
				: {};
		},
		[ kind, name, id, prop, revisionId, revisionRecord ]
	);
	// The store is selected by name, which carries no store types.
	const { editEntityRecord } = useDispatch(
		STORE_NAME as unknown as typeof coreStore
	);
	const setValue = useCallback(
		( newValue: Value ) => {
			if ( isRevision ) {
				return;
			}
			editEntityRecord( kind, name, id, {
				[ prop ]: newValue,
			} );
		},
		[ editEntityRecord, kind, name, id, prop, isRevision ]
	);

	// The caller names the type of the property.
	return [ value as Value, setValue, fullValue ];
}
