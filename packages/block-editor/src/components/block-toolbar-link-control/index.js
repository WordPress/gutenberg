/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockToolbarInlineEdit from '../block-toolbar-inline-edit';
import SettingsToolbarItem from './settings-toolbar-item';
import LinkInputToolbarItem from './link-input-toolbar-item';
import computeDisplayUrl from './compute-display-url';
import ToolbarLinkControlContext from './context';

export default function ToolbarLinkControl( {
	initialLink,
	createSuggestion,
	close,
	onChange,
} ) {
	const [ currentLink, setCurrentLink ] = useState( {
		...initialLink,
		url: computeDisplayUrl( initialLink.url ),
	} );

	const [ preferredDropdown, setPreferredDropdown ] = useState(
		'suggestions'
	);

	const updateCurrentLink = useCallback(
		( data ) => {
			const newLink = {
				...currentLink,
				...data,
			};
			if ( currentLink.id && ! data.id ) {
				delete newLink.id;
			}
			if ( 'url' in data ) {
				newLink.url = computeDisplayUrl( data.url );
			} else {
				newLink.url = currentLink.url;
			}
			if ( data.title && ! currentLink.label ) {
				newLink.label = data.title;
			}
			setCurrentLink( newLink );
			onChange( newLink );
		},
		[ currentLink ]
	);

	const contextValue = useMemo(
		() => ( {
			createSuggestion,
			currentLink,
			updateCurrentLink,
			preferredDropdown,
			setPreferredDropdown,
		} ),
		[
			createSuggestion,
			currentLink,
			updateCurrentLink,
			preferredDropdown,
			setPreferredDropdown,
		]
	);

	return (
		<BlockToolbarInlineEdit.Fill onClose={ close }>
			<ToolbarLinkControlContext.Provider value={ contextValue }>
				<ToolbarGroup>
					<LinkInputToolbarItem />
					<SettingsToolbarItem />
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarButton
						name="done"
						title={ __( 'Done' ) }
						onClick={ close }
					>
						Done
					</ToolbarButton>
				</ToolbarGroup>
			</ToolbarLinkControlContext.Provider>
		</BlockToolbarInlineEdit.Fill>
	);
}
