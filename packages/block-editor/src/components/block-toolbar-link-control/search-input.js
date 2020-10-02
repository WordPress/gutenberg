/**
 * WordPress dependencies
 */
import {
	Popover,
	__experimentalInputControl as InputControl,
	Icon,
	Spinner,
} from '@wordpress/components';
import { link as linkIcon } from '@wordpress/icons';
import { useContext, useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import LinkControlSearchResults from '../link-control/search-results';
import LinkControlSearchInput from '../link-control/search-input';
import useCreatePage from '../link-control/use-create-page';
import ToolbarLinkControlContext from './context';

const renderSuggestions = ( suggestionsProps ) => (
	<Popover focusOnMount={ false } position="bottom">
		<LinkControlSearchResults { ...suggestionsProps } />
	</Popover>
);

export default function SearchInput() {
	const { createSuggestion, currentLink, updateCurrentLink } = useContext(
		ToolbarLinkControlContext
	);

	const { createPage, isCreatingPage, errorMessage } = useCreatePage(
		createSuggestion
	);

	const { createErrorNotice } = useDispatch( 'core/notices' );
	useEffect( () => {
		if ( errorMessage ) {
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}, [ errorMessage ] );

	const searchInputRef = useRef();

	return (
		<LinkControlSearchInput
			ref={ searchInputRef }
			currentLink={ currentLink }
			placeholder="Start typing"
			renderSuggestions={ renderSuggestions }
			value={ currentLink.url }
			onCreateSuggestion={ createPage }
			onChange={ ( url ) => {
				updateCurrentLink( { url } );
			} }
			onSelect={ ( link ) => {
				updateCurrentLink( link );
			} }
			showInitialSuggestions={ false }
			allowDirectEntry
			withCreateSuggestion
			renderControl={ ( controlProps, inputProps, { isLoading } ) => {
				return (
					<InputControl
						{ ...controlProps }
						{ ...inputProps }
						className="toolbar-link-control__input-control"
						onChange={ ( value, { event } ) => {
							inputProps.onChange( event );
						} }
						prefix={
							<div className="toolbar-link-control__affix-wrapper">
								<Icon icon={ linkIcon } />
							</div>
						}
						suffix={
							<div className="toolbar-link-control__affix-wrapper">
								{ ( isCreatingPage || isLoading ) && (
									<Spinner />
								) }
							</div>
						}
					/>
				);
			} }
		/>
	);
}
