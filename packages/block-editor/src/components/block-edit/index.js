/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { useMemo, useEffect, useReducer } from '@wordpress/element';

import { hasBlockSupport } from '@wordpress/blocks';
import { filters, addAction, removeAction } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Edit from './edit';
import { BlockEditContextProvider, useBlockEditContext } from './context';
import { store as blockEditorStore } from '../../store';

/**
 * The `useBlockEditContext` hook provides information about the block this hook is being used in.
 * It returns an object with the `name`, `isSelected` state, and the `clientId` of the block.
 * It is useful if you want to create custom hooks that need access to the current blocks clientId
 * but don't want to rely on the data getting passed in as a parameter.
 *
 * @return {Object} Block edit context
 */
export { useBlockEditContext };

// Please do not export this at the package level until we have a stable API.
export const blockControlsFilterName = uuid();

function BlockControlFilters( props ) {
	const { name, isSelected, clientId } = props;
	const shouldDisplayControls = useSelect(
		( select ) => {
			if ( isSelected ) {
				return true;
			}

			const {
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );

			if ( isFirstMultiSelectedBlock( clientId ) ) {
				return getMultiSelectedBlockClientIds().every(
					( id ) => getBlockName( id ) === name
				);
			}

			return (
				hasBlockSupport(
					getBlockName( clientId ),
					'__experimentalExposeControlsToChildren',
					false
				) && hasSelectedInnerBlock( clientId )
			);
		},
		[ clientId, isSelected, name ]
	);

	const [ , forceRender ] = useReducer( () => [] );

	useEffect( () => {
		const namespace = 'core/block-edit/block-controls';

		function onHooksUpdated( updatedHookName ) {
			if ( updatedHookName === blockControlsFilterName ) {
				forceRender();
			}
		}

		addAction( 'hookRemoved', namespace, onHooksUpdated );
		addAction( 'hookAdded', namespace, onHooksUpdated );

		return () => {
			removeAction( 'hookRemoved', namespace );
			removeAction( 'hookAdded', namespace );
		};
	}, [] );

	if ( ! shouldDisplayControls ) {
		return;
	}

	const blockControlFilters = filters[ blockControlsFilterName ];

	if ( ! blockControlFilters ) {
		return;
	}

	return blockControlFilters.handlers.map(
		( { callback: Controls, namespace } ) => {
			return <Controls { ...props } key={ namespace } />;
		}
	);
}

export default function BlockEdit( props ) {
	const {
		name,
		isSelected,
		clientId,
		attributes = {},
		__unstableLayoutClassNames,
	} = props;
	const { layout = null } = attributes;
	const layoutSupport = hasBlockSupport(
		name,
		'__experimentalLayout',
		false
	);
	const context = {
		name,
		isSelected,
		clientId,
		layout: layoutSupport ? layout : null,
		__unstableLayoutClassNames,
	};
	return (
		<BlockEditContextProvider
			// It is important to return the same object if props haven't
			// changed to avoid  unnecessary rerenders.
			// See https://reactjs.org/docs/context.html#caveats.
			value={ useMemo( () => context, Object.values( context ) ) }
		>
			<BlockControlFilters { ...props } />
			<Edit { ...props } />
		</BlockEditContextProvider>
	);
}
