import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import NavigationMenuContent from '../sidebar-navigation-screen-navigation-menus/navigation-menu-content';

const { ExperimentalBlockEditorProvider, listViewContentPopoverKey } = unlock(
	blockEditorPrivateApis
);

const noop = () => {};

export default function NavigationMenuEditor( { navigationMenuId } ) {
	const { storedSettings } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );

		return {
			storedSettings: getSettings(),
		};
	}, [] );

	// There is no block inspector here, so the selected item's content
	// controls render in a List View popover. That setting is private, so it
	// needs the experimental provider: the public one strips private settings.
	const settings = useMemo( () => {
		return {
			...storedSettings,
			__experimentalFetchLinkSuggestions: ( search, searchOptions ) =>
				fetchLinkSuggestions( search, searchOptions, storedSettings ),
			[ listViewContentPopoverKey ]: true,
		};
	}, [ storedSettings ] );

	const blocks = useMemo( () => {
		if ( ! navigationMenuId ) {
			return [];
		}

		return [ createBlock( 'core/navigation', { ref: navigationMenuId } ) ];
	}, [ navigationMenuId ] );

	if ( ! navigationMenuId || ! blocks?.length ) {
		return null;
	}

	return (
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<div className="edit-site-sidebar-navigation-screen-navigation-menus__content">
				<NavigationMenuContent rootClientId={ blocks[ 0 ].clientId } />
			</div>
		</ExperimentalBlockEditorProvider>
	);
}
