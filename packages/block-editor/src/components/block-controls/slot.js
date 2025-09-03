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
			// Check if the fill has category="content" prop directly
			if ( fill?.props?.category === 'content' ) {
				return true;
			}

			// Fallback: check children if needed
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

	// Helper function to recursively check if any component has category="content"
	const hasCategoryContent = ( children ) => {
		if ( ! children ) {
			return false;
		}

		// Handle React elements (most common case)
		if ( children.type && children.props ) {
			// Check this element's category prop
			if ( children.props.category === 'content' ) {
				return true;
			}

			// Recursively check children
			if ( children.props.children ) {
				const hasCategory = hasCategoryContent(
					children.props.children
				);
				if ( hasCategory ) {
					return true;
				}
			}

			return false;
		}

		// Handle arrays of React elements
		if ( Array.isArray( children ) ) {
			const hasCategory = children.some( ( child ) => {
				return hasCategoryContent( child );
			} );
			return hasCategory;
		}

		// Handle other cases (fragments, etc.)
		if ( children.props ) {
			// Check this element's category prop
			if ( children.props.category === 'content' ) {
				return true;
			}

			// Recursively check children
			if ( children.props.children ) {
				const hasCategory = hasCategoryContent(
					children.props.children
				);
				if ( hasCategory ) {
					return true;
				}
			}

			return false;
		}

		return false;
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
