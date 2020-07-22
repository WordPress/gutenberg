/**
 * External dependencies
 */
import { unstable_CompositeItemWidget as ToolbarWidget } from 'reakit/Composite';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolbarItem as ToolbarItem,
	Popover,
	__experimentalToolbarContext as ToolbarContext,
	__experimentalInputControl as InputControl,
	Icon,
	Spinner,
} from '@wordpress/components';
import { link as linkIcon } from '@wordpress/icons';
import { useContext, useEffect, useState, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import LinkControlSearchResults from '../link-control/search-results';
import LinkControlSearchInput from '../link-control/search-input';
import useCreatePage from '../link-control/use-create-page';
import ToolbarLinkControlContext from './context';

export default function LinkInputToolbarItem() {
	const toolbar = useContext( ToolbarContext );

	const [ editUrl, setEditUrl ] = useState( '' );
	return (
		<ToolbarItem>
			{ ( htmlProps ) => (
				<div
					{ ...htmlProps }
					className="toolbar-link-control__input-wrapper"
				>
					<ToolbarWidget
						as={ ToolbarLinkEditorControl }
						{ ...toolbar }
						value={ editUrl }
						onChange={ setEditUrl }
					/>
				</div>
			) }
		</ToolbarItem>
	);
}

const ToolbarLinkEditorControl = function ( props ) {
	const {
		createSuggestion,
		currentLink,
		updateCurrentLink,
		preferredDropdown,
		setPreferredDropdown,
	} = useContext( ToolbarLinkControlContext );

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
				setPreferredDropdown( 'suggestions' );
				updateCurrentLink( { url } );
			} }
			onSelect={ ( link ) => {
				updateCurrentLink( link );
			} }
			showInitialSuggestions={ false }
			allowDirectEntry
			showSuggestions={ preferredDropdown === 'suggestions' }
			withCreateSuggestion
			renderControl={ (
				controlProps,
				inputProps,
				{ isLoading, suggestionsVisible }
			) => {
				return (
					<InputControl
						{ ...controlProps }
						{ ...inputProps }
						{ ...props }
						className="toolbar-link-control__input-control"
						value={ inputProps.value }
						onKeyDown={ ( event ) => {
							inputProps.onKeyDown( event );
							// LinkControlSearchInput renders a form which is normally submitted with an Enter key.
							// In this context however, Reakit calls .preventDefault() on the enter keydown event
							// so we need to select focused suggestion manually.
							if ( event.key === 'Enter' ) {
								// The flow of this keyDown event is quite complex, some of the consumers here are URLInput, InputControl,
								// LinkControlSearchInput, ToolbarLinkEditorControl, Reakit, some of them talk to each other and keep their
								// own local state.
								//
								// setTimeout seems to be the easiest way to achieve the intended outcome of selecting the suggestion selected
								// at the time of pressing the enter key. It is quite unintuitive so let's explore some cleaner solutions in the
								// longer run.
								setTimeout( () => {
									if ( searchInputRef?.current ) {
										searchInputRef.current.selectFocusedSuggestion();
									}
								} );
							}

							// When escape is pressed, either:
							// * Hide suggestions if they're visible
							// * Stop editing if suggestions are not visible
							if (
								event.key === 'Escape' &&
								suggestionsVisible
							) {
								setPreferredDropdown( null );
							} else {
								props.onKeyDown( event );
							}
						} }
						onChange={ ( value, { event } ) => {
							inputProps.onChange( event );
							props.onChange( event );
						} }
						onFocus={ ( event ) => {
							inputProps.onFocus( event );
							props.onFocus( event );
						} }
						onBlur={ ( event ) => {
							setPreferredDropdown( null );
							if ( 'onBlur' in inputProps ) {
								inputProps.onBlur( event );
							}
							if ( 'onBlur' in props ) {
								props.onBlur( event );
							}
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
};

const renderSuggestions = ( suggestionsProps ) => (
	<Popover focusOnMount={ false } position="bottom">
		<LinkControlSearchResults { ...suggestionsProps } />
	</Popover>
);
