import type { ForwardedRef } from 'react';
import { focus } from '@wordpress/dom';
import { Popover, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useMemo,
	useState,
	useRef,
	useEffect,
	forwardRef,
} from '@wordpress/element';
import { plus } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';
import { VisuallyHidden } from '@wordpress/ui';
import { isURL } from '@wordpress/url';
import LinkControl from '../link-control';
import type { LinkControlValue } from '../link-control/types';
import { LinkUIPageCreator } from './page-creator';
import { getSuggestionsQuery } from './get-suggestions-query';
import type { LinkUIProps, LinkUITool } from './types';

export { LinkUIPane } from './pane';
export { getSuggestionsQuery } from './get-suggestions-query';
export type { LinkUIProps, LinkUITool, LinkUICreatePage } from './types';

const PAGE_CREATOR_TOOL = 'page-creator';

/**
 * Where focus goes once the search pane is back: a tool's button, or the
 * first tabbable element.
 */
type FocusTarget = { tool: string } | 'first' | null;

/**
 * The tool button that opens the given tool, within the search pane.
 *
 * @param pane   The search pane.
 * @param toolId The tool's id.
 * @return The button, if the pane shows one for the tool.
 */
function findToolButton( pane: HTMLElement, toolId: string ) {
	return Array.from(
		pane.querySelectorAll< HTMLButtonElement >( '[data-link-ui-tool]' )
	).find( ( button ) => button.dataset.linkUiTool === toolId );
}

/**
 * The popover that edits a link: a search with a rich preview, and tools
 * under it that open their own pane, such as creating a page to link to.
 */
function UnforwardedLinkUI(
	{
		link,
		suggestionsQuery,
		transformSuggestions,
		handleEntities = false,
		title = __( 'Add link' ),
		description = __( 'Search for and add a link.' ),
		anchor,
		onChange,
		onRemove,
		onCancel,
		onClose,
		onCreatePage,
		tools = [],
	}: LinkUIProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	const {
		url,
		opensInNewTab,
		title: linkTitle,
		entityTitle,
		kind,
		type,
		id,
		image,
		badges,
	} = link;
	const hasLink = !! url?.length;

	const [ activeTool, setActiveTool ] = useState< string | null >( null );
	const [ focusTarget, setFocusTarget ] = useState< FocusTarget >( null );
	// Stable initial value for LinkControl's uncontrolled inputValue prop.
	// We track the search with the searchInputValueRef, then update the
	// initialSearchValue state with the observed searchInputValueRef
	// when mounting the LinkControl. If LinkControl becomes a fully
	// controlled component, then we can remove this extra complexity.
	const [ initialSearchValue, setInitialSearchValue ] = useState( '' );
	// Tracks the live search input between renders without causing re-renders.
	const searchInputValueRef = useRef( '' );
	// Call this instead of setting searchInputValueRef.current and
	// setInitialSearchValue separately, to keep both in sync.
	const updateSearchValue = ( value: string ) => {
		searchInputValueRef.current = value;
		setInitialSearchValue( value );
	};
	const linkControlWrapperRef = useRef< HTMLDivElement >( null );

	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/50976#issuecomment-1568226407.
	const value = useMemo(
		() => ( {
			url,
			opensInNewTab,
			title: linkTitle,
			entityTitle,
			kind,
			type,
			id,
			image,
			badges,
		} ),
		[
			url,
			opensInNewTab,
			linkTitle,
			entityTitle,
			kind,
			type,
			id,
			image,
			badges,
		]
	);

	const defaultSuggestionsQuery = useMemo(
		() => getSuggestionsQuery( type, kind ),
		[ type, kind ]
	);

	const dialogTitleId = useInstanceId(
		LinkUI,
		'block-editor-link-ui__title'
	);
	const dialogDescriptionId = useInstanceId(
		LinkUI,
		'block-editor-link-ui__description'
	);

	// Focus management when returning from a pane.
	useEffect( () => {
		if ( ! focusTarget || ! linkControlWrapperRef.current ) {
			return;
		}

		const toolButton =
			focusTarget === 'first'
				? undefined
				: findToolButton(
						linkControlWrapperRef.current,
						focusTarget.tool
					);
		if ( toolButton ) {
			toolButton.focus();
		} else {
			// Focus the first tabbable element (keyboard-accessible, excluding tabindex="-1")
			const tabbableElements = focus.tabbable.find(
				linkControlWrapperRef.current
			);
			const nextFocusTarget =
				tabbableElements[ 0 ] || linkControlWrapperRef.current;
			nextFocusTarget.focus();
		}

		setFocusTarget( null );
	}, [ focusTarget ] );

	const openPane = ( toolId: string ) => {
		// Keep the search as typed, for the pane and for coming back.
		updateSearchValue( searchInputValueRef.current );
		setActiveTool( toolId );
	};

	// The search kept its text when the pane opened, so it comes back as it
	// was.
	const closePane = () => {
		if ( activeTool ) {
			setFocusTarget( { tool: activeTool } );
		}
		setActiveTool( null );
	};

	const handlePageCreated = ( page: LinkControlValue ) => {
		// Set the new page as the current link
		onChange( page );
		// Return to main Link UI and focus the first focusable element
		setActiveTool( null );
		setFocusTarget( 'first' );
		// Clear search input value
		updateSearchValue( '' );
	};

	const allTools: LinkUITool[] = onCreatePage
		? [
				{
					id: PAGE_CREATOR_TOOL,
					label: __( 'Create page' ),
					render: ( { onBack } ) => (
						<LinkUIPageCreator
							onBack={ onBack }
							onCreatePage={ onCreatePage }
							onPageCreated={ handlePageCreated }
							initialTitle={
								initialSearchValue &&
								! isURL( initialSearchValue )
									? initialSearchValue
									: ''
							}
						/>
					),
				},
				...tools,
			]
		: tools;

	const openTool = activeTool
		? allTools.find( ( tool ) => tool.id === activeTool )
		: undefined;

	return (
		<Popover
			ref={ ref }
			placement="bottom"
			onClose={ onClose }
			anchor={ anchor }
			shift
		>
			{ ! openTool && (
				<div
					ref={ linkControlWrapperRef }
					role="dialog"
					aria-labelledby={ dialogTitleId }
					aria-describedby={ dialogDescriptionId }
				>
					<VisuallyHidden>
						<h2 id={ dialogTitleId }>{ title }</h2>

						<p id={ dialogDescriptionId }>{ description }</p>
					</VisuallyHidden>
					<LinkControl
						hasTextControl
						hasRichPreviews
						value={ value }
						showInitialSuggestions
						withCreateSuggestion={ false }
						noDirectEntry={ !! type }
						noURLSuggestion={ !! type }
						suggestionsQuery={
							suggestionsQuery ?? defaultSuggestionsQuery
						}
						transformSuggestions={ transformSuggestions }
						onChange={ onChange }
						onInputChange={ ( inputValue ) => {
							// Observe the input value so we can pass the value to the page creator
							// and restore it on back button click
							searchInputValueRef.current = inputValue;
						} }
						inputValue={ initialSearchValue }
						onRemove={ onRemove }
						onCancel={ onCancel }
						handleEntities={ handleEntities }
						forceIsEditingLink={ hasLink ? false : undefined }
						renderControlBottom={ () => {
							// Don't show the tools when there is submitted link (preview state).
							if ( hasLink || ! allTools.length ) {
								return null;
							}

							return (
								<div className="block-editor-link-ui__tools">
									{ allTools.map( ( tool ) => (
										<Button
											key={ tool.id }
											__next40pxDefaultSize
											data-link-ui-tool={ tool.id }
											icon={ tool.icon ?? plus }
											onClick={ (
												event: React.MouseEvent
											) => {
												event.preventDefault();
												openPane( tool.id );
											} }
											aria-haspopup="dialog"
										>
											{ tool.label }
										</Button>
									) ) }
								</div>
							);
						} }
					/>
				</div>
			) }

			{ openTool?.render( { onBack: closePane } ) }
		</Popover>
	);
}

export const LinkUI = forwardRef( UnforwardedLinkUI );
