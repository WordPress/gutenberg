/**
 * WordPress dependencies
 */
// Disable Reason: Needs to be refactored.
// eslint-disable-next-line no-restricted-imports

import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';

/** @typedef {import('@wordpress/components').WPCompleter} WPCompleter */

/**
 * Creates a suggestion list for links to posts or pages.
 *
 * @return {WPCompleter} A links completer.
 */
function createDynamicCompleter() {
	return {
		name: 'links',
		className: 'block-editor-autocompleters__dynamic',
		triggerPrefix: '//',
		options: () => {
			const options = [
				{
					title: __( 'Current year' ),
					preview: new Date().getFullYear(),
					save: '[dynamic-text-current-year]',
					icon: '',
				},
			];

			return options;
		},
		getOptionKeywords( item ) {
			const expansionWords = item.title.split( /\s+/ );
			return [ ...expansionWords ];
		},
		getOptionLabel( item ) {
			return (
				<>
					{ item.icon && <Icon key="icon" icon={ item.icon } /> }
					{ item.title }
				</>
			);
		},
		getOptionCompletion( item ) {
			return item.save;
		},
	};
}

/**
 * Creates a suggestion list for links to posts or pages..
 *
 * @return {WPCompleter} A link completer.
 */
export default createDynamicCompleter();
