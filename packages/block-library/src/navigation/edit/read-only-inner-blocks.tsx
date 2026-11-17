import type { ReactNode } from 'react';
import parse from 'html-react-parser';
import { useDisabled } from '@wordpress/compose';
import { safeHTML } from '@wordpress/dom';
import { Children, isValidElement } from '@wordpress/element';

// Blocks that the frontend wraps in a list item. Mirrors
// `WP_Navigation_Block_Renderer::$needs_list_item_wrapper` in `index.php`.
const NEEDS_LIST_ITEM_WRAPPER = [
	'wp-block-site-title',
	'wp-block-site-logo',
	'wp-block-social-links',
];

function isListItem( node: ReactNode ) {
	return isValidElement( node ) && node.type === 'li';
}

function needsListItemWrapper( node: ReactNode ) {
	if ( ! isValidElement< { className?: unknown } >( node ) ) {
		return false;
	}
	const { className } = node.props;
	return (
		typeof className === 'string' &&
		className
			.split( /\s+/ )
			.some( ( name ) => NEEDS_LIST_ITEM_WRAPPER.includes( name ) )
	);
}

/**
 * Groups the rendered menu items the same way as the frontend (see
 * `WP_Navigation_Block_Renderer::get_inner_blocks_html()` in `index.php`):
 * consecutive list items share a `ul.wp-block-navigation__container`, and
 * other blocks, such as Search, are rendered between the lists.
 *
 * @param nodes The top-level nodes of the rendered menu.
 * @return The grouped nodes.
 */
function groupMenuItems( nodes: ReactNode[] ) {
	const groups: ReactNode[] = [];
	let listItems: ReactNode[] = [];

	const closeList = () => {
		if ( listItems.length ) {
			groups.push(
				<ul
					key={ `list-${ groups.length }` }
					className="wp-block-navigation__container"
				>
					{ listItems }
				</ul>
			);
			listItems = [];
		}
	};

	nodes.forEach( ( node, index ) => {
		if ( typeof node === 'string' && ! node.trim() ) {
			return;
		}

		if ( isListItem( node ) ) {
			listItems.push( node );
		} else if ( needsListItemWrapper( node ) ) {
			listItems.push(
				<li
					key={ isValidElement( node ) ? node.key : index }
					className="wp-block-navigation-item"
				>
					{ node }
				</li>
			);
		} else {
			closeList();
			groups.push( node );
		}
	} );
	closeList();

	return groups;
}

interface ReadOnlyNavigationInnerBlocksProps {
	/** The rendered content of the Navigation Menu. */
	content?: string;
}

/**
 * Renders a preview of a Navigation Menu that the user cannot edit. Links
 * and form fields in the preview are inert.
 *
 * @param props         Component props.
 * @param props.content The rendered content of the Navigation Menu.
 */
export default function ReadOnlyNavigationInnerBlocks( {
	content = '',
}: ReadOnlyNavigationInnerBlocksProps ) {
	const disabledRef = useDisabled();
	const nodes = Children.toArray( parse( safeHTML( content ) ) );

	return (
		<div
			ref={ disabledRef }
			className="wp-block-navigation__read-only-items"
		>
			{ groupMenuItems( nodes ) }
		</div>
	);
}
