/**
 * External dependencies
 */
import parse from 'html-react-parser';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';
import { safeHTML } from '@wordpress/dom';
import { isValidElement } from '@wordpress/element';
import { registerIconResolver } from '@wordpress/widget-primitives';
import type { WidgetIcon } from '@wordpress/widget-primitives';

/**
 * Registers the dashboard's icon resolver: widget icon references
 * resolve against the `icon` core-data entity, and the record's SVG
 * content becomes the rendered element hosts receive. Idempotent: the
 * registry keeps the first registration.
 */
export function registerDashboardIconResolver() {
	registerIconResolver( async ( reference ) => {
		const record = ( await resolveSelect( coreStore ).getEntityRecord(
			'root',
			'icon',
			reference
		) ) as { content?: string } | undefined;

		if ( ! record?.content ) {
			return null;
		}

		/*
		 * Registry-served content may carry whitespace around the root
		 * `<svg>`, which makes `parse()` return an array of nodes; the
		 * icon is the element among them.
		 */
		const parsed = parse( safeHTML( record.content.trim() ) );
		const element = Array.isArray( parsed )
			? parsed.find( isValidElement )
			: parsed;

		return isValidElement( element ) ? ( element as WidgetIcon ) : null;
	} );
}
