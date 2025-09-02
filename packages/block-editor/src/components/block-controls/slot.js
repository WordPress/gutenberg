/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import {
	privateApis,
	__experimentalToolbarContext as ToolbarContext,
	ToolbarGroup,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import groups from './groups';
import { unlock } from '../../lock-unlock';
import { useBlockEditingMode } from '../block-editing-mode';

const { ComponentsContext } = unlock( privateApis );

export default function BlockControlsSlot( { group = 'default', ...props } ) {
	const toolbarState = useContext( ToolbarContext );
	const contextState = useContext( ComponentsContext );
	const blockEditingMode = useBlockEditingMode();

	const fillProps = useMemo(
		() => ( {
			forwardedContext: [
				[ ToolbarContext.Provider, { value: toolbarState } ],
				[ ComponentsContext.Provider, { value: contextState } ],
			],
		} ),
		[ toolbarState, contextState ]
	);

	// Create filter function for content-only mode
	const filter = useMemo( () => {
		if ( blockEditingMode !== 'contentOnly' ) {
			return undefined; // No filtering in default mode
		}

		return ( fill ) => {
			// Check if the fill has category="content"
			if ( fill?.children && typeof fill.children === 'function' ) {
				// For function children, we need to check the rendered result
				const renderedChildren = fill.children( fillProps );
				return hasCategoryContent( renderedChildren );
			} else if ( fill?.children ) {
				// For React element children, check directly
				return hasCategoryContent( fill.children );
			}
			return false;
		};
	}, [ blockEditingMode, fillProps ] );

	// Helper function to check if any component has category="content"
	const hasCategoryContent = ( children ) => {
		if ( ! children ) {
			return false;
		}

		if ( Array.isArray( children ) ) {
			return children.some( ( child ) => {
				// Check if this component has category="content"
				if ( child?.props?.category === 'content' ) {
					return true;
				}

				// Recursively check children
				return hasCategoryContent( child?.props?.children );
			} );
		}

		// Check if this component has category="content"
		if ( children?.props?.category === 'content' ) {
			return true;
		}

		// Recursively check children
		return hasCategoryContent( children?.props?.children );
	};

	const slotFill = groups[ group ];
	const fills = useSlotFills( slotFill?.name );

	if ( ! slotFill ) {
		warning( `Unknown BlockControls group "${ group }" provided.` );
		return null;
	}

	if ( ! fills?.length ) {
		return null;
	}

	const { Slot } = slotFill;

	// Use the new filter prop instead of children function
	const slot = (
		<Slot { ...props } fillProps={ fillProps } filter={ filter } />
	);

	if ( group === 'default' ) {
		return slot;
	}

	return <ToolbarGroup>{ slot }</ToolbarGroup>;
}
