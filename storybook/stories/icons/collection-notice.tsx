import type { Element as ReactElement } from '@wordpress/element';
import { Link, Notice } from '@wordpress/ui';
import type { Collection } from './manifest';

const WP_GET_ICON_URL =
	'https://developer.wordpress.org/reference/functions/wp_get_icon/';

const DESCRIPTIONS: Record< Collection, ReactElement > = {
	all: (
		<>
			All icons are available. Import them from the npm package in
			JavaScript.{ ' ' }
			<Link
				href="https://developer.wordpress.org/block-editor/reference-guides/packages/packages-icons/#usage"
				openInNewTab
			>
				See the usage example
			</Link>
			.
		</>
	),
	core: (
		<>
			These icons are registered in WordPress. Render them in PHP with{ ' ' }
			<Link href={ WP_GET_ICON_URL } openInNewTab>
				wp_get_icon()
			</Link>
			. They are also available through the Icons REST API and in the Icon
			block.
		</>
	),
	'core-admin': (
		<>
			These icons are registered in WordPress for the admin interface.
			Render them in PHP with{ ' ' }
			<Link href={ WP_GET_ICON_URL } openInNewTab>
				wp_get_icon()
			</Link>
			. They are not available through the Icons REST API or in the Icon
			block.
		</>
	),
};

/**
 * Explains how to use the icons in the selected collection.
 */
export function CollectionNotice( { collection }: { collection: Collection } ) {
	return (
		<Notice.Root intent="info">
			<Notice.Description>
				{ DESCRIPTIONS[ collection ] }
			</Notice.Description>
		</Notice.Root>
	);
}
