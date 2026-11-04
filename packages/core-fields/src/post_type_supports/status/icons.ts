import {
	trash,
	drafts,
	published,
	scheduled,
	pending,
	notAllowed,
} from '@wordpress/icons';

/**
 * The icon of each status.
 */
export const STATUS_ICONS: Record< string, typeof drafts > = {
	draft: drafts,
	future: scheduled,
	pending,
	private: notAllowed,
	publish: published,
	trash,
};
