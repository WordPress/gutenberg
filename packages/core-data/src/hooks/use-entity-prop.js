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
 * @example
 * ```js
 * import { useEntityProp } from '@wordpress/core-data';
 *
 * function MetaUpdater( { postType, postId } ) {
 * 	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta', postId );
 *
 * 	const handleSyncUpdate = () => {
 * 		const result = syncTask();
 *
 * 		// Use setter with a static value:
 * 		setMeta( { ...meta, taskKey: result } );
 * 	};
 *
 * 	const handleAsyncUpdate = async () => {
 * 		const result = await asyncTask();
 *
 * 		// Use setter with an updater function:
 * 		setMeta( ( currentMeta ) => ( { ...currentMeta, taskKey: result } ) );
 * 	};
 * }
 * ```
 *
 * @param {string}        kind  The entity kind.
 * @param {string}        name  The entity name.
 * @param {string}        prop  The property name.
 * @param {number|string} [_id] An entity ID to use instead of the context-provided one.
 *
 * @return {[*, Function, *]} An array where the first item is the
 *                            property value, the second is the
 *                            setter (which accepts either a value or an updater function)
 *                            and the third is the full value
 * 							  object from REST API containing more
 * 							  information like `raw`, `rendered` and
 * 							  `protected` props.
 */
export default function useEntityProp( kind, name, prop, _id ) {
	const providerId = useEntityId( kind, name );
	const id = _id ?? providerId;

	const { value, fullValue } = useSelect(
		( select ) => {
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
		[ kind, name, id, prop ]
	);
	const { editEntityRecord } = useDispatch( STORE_NAME );
	const { getEditedEntityRecord } = useSelect(
		( select ) => select( STORE_NAME ),
		[]
	);

	const setValue = useCallback(
		( newValue ) => {
			if ( typeof newValue === 'function' ) {
				const currentRecord = getEditedEntityRecord( kind, name, id );
				const currentValue = currentRecord
					? currentRecord[ prop ]
					: undefined;
				newValue = newValue( currentValue );
			}
			editEntityRecord( kind, name, id, {
				[ prop ]: newValue,
			} );
		},
		[ editEntityRecord, getEditedEntityRecord, kind, name, id, prop ]
	);

	return [ value, setValue, fullValue ];
}
