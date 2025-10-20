/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../name';
import useEntityId from './use-entity-id';

/**
 * Hook that returns the value and a setter for the
 * specified property of the nearest provided
 * entity of the specified type.
 *
 * @param {string}        kind      The entity kind.
 * @param {string}        name      The entity name.
 * @param {string}        prop      The property name.
 * @param {number|string} [_id]     An entity ID to use instead of the context-provided one.
 * @param {string}        [context] The context to use when accessing the entity.
 *
 * @return {[*, Function, *]} An array where the first item is the
 *                            property value, the second is the
 *                            setter and the third is the full value
 *                            object from REST API containing more
 *                            information like `raw`, `rendered` and
 *                            `protected` props.
 */
export default function useEntityProp( kind, name, prop, _id, context ) {
	const providerId = useEntityId( kind, name );
	const id = _id ?? providerId;

	const { value, fullValue } = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord } =
				select( STORE_NAME );
			const query = context ? { context } : null;
			const record = getEntityRecord( kind, name, id, query ); // Trigger resolver.

			if ( ! record ) {
				return {};
			}

			if ( context === 'view' ) {
				return {
					value: record[ prop ],
					fullValue: record[ prop ],
				};
			}

			const editedRecord = getEditedEntityRecord( kind, name, id );
			return editedRecord
				? {
						value: editedRecord[ prop ],
						fullValue: record[ prop ],
				  }
				: {};
		},
		[ kind, name, id, prop, context ]
	);
	const { editEntityRecord } = useDispatch( STORE_NAME );
	const setValue = useCallback(
		( newValue ) => {
			editEntityRecord( kind, name, id, {
				[ prop ]: newValue,
			} );
		},
		[ editEntityRecord, kind, name, id, prop ]
	);

	return [ value, setValue, fullValue ];
}
