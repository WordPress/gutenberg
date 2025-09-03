/**
 * Internal dependencies
 */
import { useBlockEditingMode } from '../block-editing-mode';

/**
 * A wrapper component that conditionally renders its children based on the block editing mode.
 *
 * In content-only mode, only components with `category="content"` will be rendered.
 * In other modes, all components are rendered.
 *
 * @param {Object} props          The props object.
 * @param {any}    props.children The children to render.
 * @return {any} The filtered children.
 */
export function ContentOnlyFilter( { children } ) {
	const blockEditingMode = useBlockEditingMode();

	// In content-only mode, filter children to only show those with category="content"
	if ( blockEditingMode === 'contentOnly' ) {
		return filterChildrenByCategory( children );
	}

	// In other modes, render all components
	return children;
}

// Helper function to recursively filter children
function filterChildrenByCategory( children ) {
	if ( ! children ) {
		return null;
	}

	// Handle arrays
	if ( Array.isArray( children ) ) {
		const filtered = children
			.map( filterChildrenByCategory )
			.filter( Boolean );
		return filtered.length > 0 ? filtered : null;
	}

	// Handle React elements
	if ( children.type && children.props ) {
		// If this component has category="content", keep it
		if ( children.props.category === 'content' ) {
			return children;
		}

		// If this component doesn't have category="content", filter its children
		if ( children.props.children ) {
			const filteredChildren = filterChildrenByCategory(
				children.props.children
			);
			if ( filteredChildren ) {
				return {
					...children,
					props: {
						...children.props,
						children: filteredChildren,
					},
				};
			}
		}

		// No category="content" found in this branch
		return null;
	}

	// Handle other cases (fragments, etc.)
	if ( children.props ) {
		if ( children.props.category === 'content' ) {
			return children;
		}
		if ( children.props.children ) {
			return filterChildrenByCategory( children.props.children );
		}
		return null;
	}

	return null;
}
