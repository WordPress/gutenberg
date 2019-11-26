/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useRef,
	useCallback,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { defaultEntities, kinds } from './entities';

const entities = {
	...defaultEntities.reduce( ( acc, entity ) => {
		if ( ! acc[ entity.kind ] ) {
			acc[ entity.kind ] = {};
		}
		acc[ entity.kind ][ entity.name ] = { context: createContext() };
		return acc;
	}, {} ),
	...kinds.reduce( ( acc, kind ) => {
		acc[ kind.name ] = {};
		return acc;
	}, {} ),
};
const getEntity = ( kind, type ) => {
	if ( ! entities[ kind ] ) {
		throw new Error( `Missing entity config for kind: ${ kind }.` );
	}

	if ( ! entities[ kind ][ type ] ) {
		entities[ kind ][ type ] = { context: createContext() };
	}

	return entities[ kind ][ type ];
};

/**
 * Context provider component for providing
 * an entity for a specific entity type.
 *
 * @param {Object} props          The component's props.
 * @param {string} props.kind     The entity kind.
 * @param {string} props.type     The entity type.
 * @param {number} props.id       The entity ID.
 * @param {*}      props.children The children to wrap.
 *
 * @return {Object} The provided children, wrapped with
 *                   the entity's context provider.
 */
export default function EntityProvider( { kind, type, id, children } ) {
	const Provider = getEntity( kind, type ).context.Provider;
	return <Provider value={ id }>{ children }</Provider>;
}

/**
 * Hook that returns the ID for the nearest
 * provided entity of the specified type.
 *
 * @param {string} kind The entity kind.
 * @param {string} type The entity type.
 */
export function useEntityId( kind, type ) {
	return useContext( getEntity( kind, type ).context );
}

/**
 * Hook that returns the value and a setter for the
 * specified property of the nearest provided
 * entity of the specified type.
 *
 * @param {string} kind The entity kind.
 * @param {string} type The entity type.
 * @param {string} prop The property name.
 *
 * @return {[*, Function]} A tuple where the first item is the
 *                          property value and the second is the
 *                          setter.
 */
export function useEntityProp( kind, type, prop ) {
	const id = useEntityId( kind, type );

	// Use a ref to avoid recreating a new `setValue` to
	// support components that cache change handlers on
	// mount.
	const isLockedRef = useRef();
	const [ value, isLocked ] = useSelect(
		( select ) => {
			const {
				getEntityRecord,
				getEditedEntityRecord,
				getLockedEntityProps,
			} = select( 'core' );
			getEntityRecord( kind, type, id ); // Trigger resolver.
			const entity = getEditedEntityRecord( kind, type, id );
			const lockedProps = getLockedEntityProps( kind, type, id );
			const _isLocked = lockedProps[ prop ] && lockedProps[ prop ]();
			isLockedRef.current = _isLocked;
			return [ entity && entity[ prop ], _isLocked ];
		},
		[ kind, type, id, prop ]
	);

	const { editEntityRecord } = useDispatch( 'core' );
	const setValue = useCallback(
		( newValue ) => {
			if ( isLockedRef.current ) {
				// eslint-disable-next-line no-console
				console.warn(
					`Prop "${ prop }" is locked for entity of kind "${ kind }", type "${ type }", and id "${ id }".`
				);
				return;
			}
			editEntityRecord( kind, type, id, {
				[ prop ]: newValue,
			} );
		},
		[ kind, type, id, prop ]
	);

	return [ value, setValue, isLocked ];
}

/**
 * Hook that returns whether the nearest provided
 * entity of the specified type is dirty, saving,
 * and a function to save it.
 *
 * The last, optional parameter is for scoping the
 * selection to a single property or a list properties.
 *
 * By default, dirtyness detection and saving considers
 * and handles all properties of an entity, but this
 * last parameter lets you scope it to a single property
 * or a list of properties for each instance of this hook.
 *
 * @param {string}          kind    The entity kind.
 * @param {string}          type    The entity type.
 * @param {string|[string]} [props] The property name or list of property names.
 */
export function __experimentalUseEntitySaving( kind, type, props ) {
	const id = useEntityId( kind, type );

	const [ isDirty, isSaving, edits ] = useSelect(
		( select ) => {
			const { getEntityRecordNonTransientEdits, isSavingEntityRecord } = select(
				'core'
			);
			const _edits = getEntityRecordNonTransientEdits( kind, type, id );
			const editKeys = Object.keys( _edits );
			return [
				props ?
					editKeys.some( ( key ) =>
						typeof props === 'string' ? key === props : props.includes( key )
					) :
					editKeys.length > 0,
				isSavingEntityRecord( kind, type, id ),
				_edits,
			];
		},
		[ kind, type, id, props ]
	);

	const { saveEntityRecord } = useDispatch( 'core' );
	const save = useCallback( () => {
		let filteredEdits = edits;
		if ( typeof props === 'string' ) {
			filteredEdits = { [ props ]: filteredEdits[ props ] };
		} else if ( props ) {
			filteredEdits = filteredEdits.reduce( ( acc, key ) => {
				if ( props.includes( key ) ) {
					acc[ key ] = filteredEdits[ key ];
				}
				return acc;
			}, {} );
		}
		saveEntityRecord( kind, type, { id, ...filteredEdits } );
	}, [ kind, type, id, props, edits ] );

	return [ isDirty, isSaving, save ];
}
