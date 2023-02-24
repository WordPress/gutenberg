/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

import { hasBlockSupport } from '@wordpress/blocks';
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
	const shouldDisplayControls = useSelect(
		( select ) => {
			if ( isSelected ) {
				return true;
			}

			const {
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
			} = select( blockEditorStore );

			if ( isFirstMultiSelectedBlock( clientId ) ) {
				return getMultiSelectedBlockClientIds().every(
					( id ) => getBlockName( id ) === name
				);
			}

			return false;
		},
		[ clientId, isSelected, name ]
	);
	const shouldDisplayControlsWithinChildren = useSelect(
		( select ) => {
			const { getBlockName, hasSelectedInnerBlock } =
				select( blockEditorStore );
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
	const context = {
		name,
		isSelected,
		clientId,
		layout: layoutSupport ? layout : null,
		__unstableLayoutClassNames,
		shouldDisplayControls,
		shouldDisplayControlsWithinChildren,
	};
	return (
		<BlockEditContextProvider
			// It is important to return the same object if props haven't
			// changed to avoid  unnecessary rerenders.
			// See https://reactjs.org/docs/context.html#caveats.
			value={ useMemo( () => context, Object.values( context ) ) }
		>
			<Edit { ...props } />
		</BlockEditContextProvider>
	);
}
