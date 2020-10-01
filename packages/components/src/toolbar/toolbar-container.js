/**
 * External dependencies
 */
import { useToolbarState, Toolbar } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { forwardRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';
import { getRTL } from '../utils/rtl';

function ToolbarContainer(
	{ label, initialIndex: index, onIndexChange, ...props },
	ref
) {
	// https://reakit.io/docs/basic-concepts/#state-hooks
	// Passing baseId for server side rendering (which includes snapshots)
	// If an id prop is passed to Toolbar, toolbar items will use it as a base for their ids
	const toolbarState = useToolbarState( {
		loop: true,
		baseId: props.id,
		rtl: getRTL(),
	} );

	const [ initialCurrentId ] = useState( toolbarState.currentId );
	const [ initialIndex ] = useState( index );

	useEffect( () => {
		if ( ! onIndexChange ) return;
		const itemIndex = toolbarState.items.findIndex(
			( item ) => item.id === toolbarState.currentId
		);
		onIndexChange( itemIndex );
	}, [ toolbarState.currentId, toolbarState.items, onIndexChange ] );

	useEffect( () => {
		if (
			! initialCurrentId &&
			initialIndex !== undefined &&
			toolbarState.items[ initialIndex ]
		) {
			toolbarState.setCurrentId( toolbarState.items[ initialIndex ].id );
		}
	}, [ initialCurrentId, toolbarState.items, initialIndex ] );

	return (
		// This will provide state for `ToolbarButton`'s
		<ToolbarContext.Provider value={ toolbarState }>
			<Toolbar
				ref={ ref }
				aria-label={ label }
				{ ...toolbarState }
				{ ...props }
			/>
		</ToolbarContext.Provider>
	);
}

export default forwardRef( ToolbarContainer );
