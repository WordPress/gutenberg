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
 * Registers the dashboard's icon resolver: references resolve against
 * the `icon` entity, and the record's SVG content becomes the element.
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
		 * Whitespace around the root `<svg>` makes `parse()` return an
		 * array; take the element.
		 */
		const parsed = parse( safeHTML( record.content.trim() ) );
		const element = Array.isArray( parsed )
			? parsed.find( isValidElement )
			: parsed;

		return isValidElement( element ) ? ( element as WidgetIcon ) : null;
	} );
}
