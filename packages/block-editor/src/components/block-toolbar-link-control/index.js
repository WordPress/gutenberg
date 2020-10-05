/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockToolbarInlineEdit from '../block-toolbar-inline-edit';
import SearchInput from './search-input';
import SettingsMenu from './settings-menu';
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
		} ),
		[ createSuggestion, currentLink, updateCurrentLink ]
	);

	return (
		<BlockToolbarInlineEdit.Fill onClose={ close }>
			<ToolbarLinkControlContext.Provider value={ contextValue }>
				<SearchInput />
				<SettingsMenu />
				<Button onClick={ close }>{ __( 'Done' ) }</Button>
			</ToolbarLinkControlContext.Provider>
		</BlockToolbarInlineEdit.Fill>
	);
}
