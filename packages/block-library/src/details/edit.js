/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	TextControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	privateApis as componentsPrivateApis,
	Placeholder,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { unlock } from '../lock-unlock';

const { withIgnoreIMEEvents } = unlock( componentsPrivateApis );

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __( 'Type / to add a hidden block' ),
		},
	],
];

function DetailsEdit( { attributes, setAttributes, clientId, context } ) {
	const {
		name,
		showContent,
		summary,
		allowedBlocks,
		placeholder,
		useDynamicContent,
	} = attributes;

	const { postId, postType, queryId } = context;

	// Check if we're inside a query loop
	const isInQueryLoop = !! queryId;

	// Fetch post data when inside query loop and dynamic content is enabled
	const { postTitle, postContent, isLoading } = useSelect(
		( select ) => {
			if ( ! isInQueryLoop || ! useDynamicContent || ! postId ) {
				return {
					postTitle: null,
					postContent: null,
					isLoading: false,
				};
			}

			const { getEntityRecord, hasFinishedResolution } =
				select( coreStore );

			const post = getEntityRecord( 'postType', postType, postId );

			const hasResolved = hasFinishedResolution( 'getEntityRecord', [
				'postType',
				postType,
				postId,
			] );

			return {
				postTitle: post?.title?.rendered || post?.title?.raw || '',
				postContent:
					post?.content?.rendered || post?.content?.raw || '',
				isLoading: ! hasResolved,
			};
		},
		[ isInQueryLoop, useDynamicContent, postId, postType ]
	);

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		__experimentalCaptureToolbars: true,
		allowedBlocks,
		// Lock inner blocks when using dynamic content
		templateLock: useDynamicContent ? 'all' : false,
		renderAppender: useDynamicContent ? false : undefined,
	} );

	const [ isOpen, setIsOpen ] = useState( showContent );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Check if the inner blocks are selected.
	const hasSelectedInnerBlock = useSelect(
		( select ) =>
			select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId ]
	);

	const handleSummaryKeyDown = ( event ) => {
		if ( event.key === 'Enter' && ! event.shiftKey ) {
			setIsOpen( ( prevIsOpen ) => ! prevIsOpen );
			event.preventDefault();
		}
	};

	// Prevent spacebar from toggling <details> while typing.
	const handleSummaryKeyUp = ( event ) => {
		if ( event.key === ' ' ) {
			event.preventDefault();
		}
	};

	// Show loading state when fetching dynamic content
	if ( useDynamicContent && isLoading ) {
		return (
			<div { ...blockProps }>
				<Placeholder>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	const isDynamicMode = useDynamicContent && isInQueryLoop;

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							showContent: false,
							useDynamicContent: false,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						isShownByDefault
						label={ __( 'Open by default' ) }
						hasValue={ () => showContent }
						onDeselect={ () => {
							setAttributes( {
								showContent: false,
							} );
						} }
					>
						<ToggleControl
							label={ __( 'Open by default' ) }
							checked={ showContent }
							onChange={ () =>
								setAttributes( {
									showContent: ! showContent,
								} )
							}
						/>
					</ToolsPanelItem>
					{ isInQueryLoop && (
						<ToolsPanelItem
							isShownByDefault
							label={ __( 'Use dynamic content' ) }
							hasValue={ () => useDynamicContent }
							onDeselect={ () => {
								setAttributes( {
									useDynamicContent: false,
								} );
							} }
						>
							<ToggleControl
								label={ __( 'Use dynamic content' ) }
								help={ __(
									'Use post title as summary and post content as details body.'
								) }
								checked={ useDynamicContent }
								onChange={ () =>
									setAttributes( {
										useDynamicContent: ! useDynamicContent,
									} )
								}
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="advanced">
				<TextControl
					__next40pxDefaultSize
					label={ __( 'Name attribute' ) }
					value={ name || '' }
					onChange={ ( newName ) =>
						setAttributes( { name: newName } )
					}
					help={ __(
						'Enables multiple Details blocks with the same name attribute to be connected, with only one open at a time.'
					) }
				/>
			</InspectorControls>
			<details
				{ ...( isDynamicMode ? blockProps : innerBlocksProps ) }
				open={ isOpen || hasSelectedInnerBlock }
				onToggle={ ( event ) => setIsOpen( event.target.open ) }
				name={ name || '' }
			>
				<summary
					onKeyDown={ withIgnoreIMEEvents( handleSummaryKeyDown ) }
					onKeyUp={ handleSummaryKeyUp }
				>
					{ isDynamicMode && postTitle ? (
						<span
							dangerouslySetInnerHTML={ {
								__html: postTitle,
							} }
						/>
					) : (
						<RichText
							identifier="summary"
							aria-label={ __(
								'Write summary. Press Enter to expand or collapse the details.'
							) }
							placeholder={
								placeholder || __( 'Write summary…' )
							}
							withoutInteractiveFormatting
							value={ summary }
							onChange={ ( newSummary ) =>
								setAttributes( { summary: newSummary } )
							}
						/>
					) }
				</summary>
				{ isDynamicMode && postContent ? (
					<div
						className="wp-block-details__content"
						dangerouslySetInnerHTML={ {
							__html: postContent,
						} }
					/>
				) : (
					innerBlocksProps.children
				) }
			</details>
		</>
	);
}

export default DetailsEdit;
