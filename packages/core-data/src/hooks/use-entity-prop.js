import { useCallback, useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../name';
import { EntityContext } from '../entity-context';
import useEntityId from './use-entity-id';

// A stable reference, because `getRevision` memoizes on the query's identity.
const REVISION_QUERY = {
	context: 'edit',
	_fields:
		'id,date,author,meta,title.raw,title.rendered,excerpt.raw,excerpt.rendered,content.raw',
};

/**
 * Hook that returns the value and a setter for the
 * specified property of the nearest provided
 * entity of the specified type.
 *
 * @param {string}        kind  The entity kind.
 * @param {string}        name  The entity name.
 * @param {string}        prop  The property name.
 * @param {number|string} [_id] An entity ID to use instead of the context-provided one.
 *
 * @return {[*, Function, *]} An array where the first item is the
 *                            property value, the second is the
 *                            setter and the third is the full value
 * 							  object from REST API containing more
 * 							  information like `raw`, `rendered` and
 * 							  `protected` props.
 */
export default function useEntityProp( kind, name, prop, _id ) {
	const providerId = useEntityId( kind, name );
	const id = _id ?? providerId;
	const context = useContext( EntityContext );
	// A revision applies only to the record it was provided for. The ID can be
	// given as a string or a number, so compare the two loosely.
	const revisionId =
		String( id ) === String( providerId )
			? context?.revision?.[ kind ]?.[ name ]
			: undefined;

	const { value, fullValue } = useSelect(
		( select ) => {
			if ( revisionId ) {
				const { getRevision, hasRevision } = select( STORE_NAME );
				const revision = getRevision(
					kind,
					name,
					id,
					revisionId,
					REVISION_QUERY
				); // Trigger resolver.
				// `getRevision` returns the requested fields as `undefined`
				// until they are received, so wait for the full record.
				return hasRevision( kind, name, id, revisionId, REVISION_QUERY )
					? {
							value: revision[ prop ]?.raw ?? revision[ prop ],
							fullValue: revision[ prop ],
					  }
					: {};
			}

			const { getEntityRecord, getEditedEntityRecord } =
				select( STORE_NAME );
			const record = getEntityRecord( kind, name, id ); // Trigger resolver.
			const editedRecord = getEditedEntityRecord( kind, name, id );
			return record && editedRecord
				? {
						value: editedRecord[ prop ],
						fullValue: record[ prop ],
				  }
				: {};
		},
		[ kind, name, id, prop, revisionId ]
	);
	const { editEntityRecord } = useDispatch( STORE_NAME );
	const setValue = useCallback(
		( newValue ) => {
			if ( revisionId ) {
				return;
			}
			editEntityRecord( kind, name, id, {
				[ prop ]: newValue,
			} );
		},
		[ editEntityRecord, kind, name, id, prop, revisionId ]
	);

	return [ value, setValue, fullValue ];
}
