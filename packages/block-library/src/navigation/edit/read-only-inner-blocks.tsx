import { useDisabled } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useServerSideRender } from '@wordpress/server-side-render';
import { Spinner } from '@wordpress/ui';
import HtmlRenderer from '../../utils/html-renderer';

/**
 * Returns the menu items from the server-rendered Navigation block, without
 * the `nav` element around them. The editor already renders that element as
 * the block wrapper.
 *
 * @param rendered The server-rendered Navigation block.
 * @return The HTML of the menu items.
 */
export function getMenuItemsHtml( rendered = '' ) {
	const document = new window.DOMParser().parseFromString(
		rendered,
		'text/html'
	);
	return document.body.firstElementChild?.innerHTML ?? '';
}

interface ReadOnlyNavigationInnerBlocksProps {
	/** The attributes of the Navigation block, including the menu's `ref`. */
	attributes: Record< string, unknown >;
}

/**
 * Renders a preview of a Navigation Menu that the user cannot edit. The menu
 * is rendered on the server by the Navigation block itself, so the preview
 * matches the frontend. Links and form fields in the preview are inert.
 *
 * @param props            Component props.
 * @param props.attributes The attributes of the Navigation block.
 */
export default function ReadOnlyNavigationInnerBlocks( {
	attributes,
}: ReadOnlyNavigationInnerBlocksProps ) {
	const disabledRef = useDisabled();
	const { content, status } = useServerSideRender( {
		block: 'core/navigation',
		// The editor renders the overlay itself, so only the menu items are
		// needed from the server.
		attributes: { ...attributes, overlayMenu: 'never' },
	} );

	// Keep showing the last preview while a new one loads, so changing a
	// block setting doesn't make the menu flash.
	const [ rendered, setRendered ] = useState< string >();
	if ( status === 'success' && content !== rendered ) {
		setRendered( content );
	}
	const html = useMemo( () => getMenuItemsHtml( rendered ), [ rendered ] );

	if ( rendered === undefined ) {
		return status === 'error' ? (
			<p>{ __( 'The Navigation Menu could not be shown.' ) }</p>
		) : (
			<Spinner />
		);
	}

	return (
		<div
			ref={ disabledRef }
			className="wp-block-navigation__read-only-items"
		>
			<HtmlRenderer html={ html } />
		</div>
	);
}
