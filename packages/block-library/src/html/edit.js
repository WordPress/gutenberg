/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	useBlockProps,
	PlainText,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToolbarGroup,
	Placeholder,
	Button,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { code } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Preview from './preview';
import HTMLEditModal from './modal';
import { parseContent, serializeContent } from './utils';

/**
 * Strips the CSS and JS wrapper tags (<style> and <script>) and any trailing
 * double-newlines from the serialized block content to retrieve the raw HTML.
 *
 * @param {string} raw The full serialized block content.
 * @return {string} The HTML-only portion.
 */
function getRawHtml( raw = '' ) {
	return raw.replace(
		/<(style|script)\s+data-wp-block-html="(?:css|js)">[\s\S]*?<\/\1>(\n\n)?/g,
		''
	);
}

/**
 * Renders the HTML/Preview toolbar toggle.
 *
 * @param {Object}   props             Component props.
 * @param {string}   props.viewMode    Current editor mode.
 * @param {Function} props.setViewMode State setter for the current mode.
 * @return {Object} The toggle toolbar group.
 */
function ViewModeToggle( { viewMode, setViewMode } ) {
	const isPreview = viewMode === 'preview';

	return (
		<ToolbarGroup>
			<ToolbarButton
				isPressed={ ! isPreview }
				onClick={ () => setViewMode( 'html' ) }
			>
				HTML
			</ToolbarButton>
			<ToolbarButton
				isPressed={ isPreview }
				onClick={ () => setViewMode( 'preview' ) }
			>
				{ __( 'Preview' ) }
			</ToolbarButton>
		</ToolbarGroup>
	);
}

export default function HTMLEdit( { attributes, setAttributes, isSelected } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ viewMode, setViewMode ] = useState( 'preview' );
	const blockProps = useBlockProps( {
		className: 'block-library-html__edit',
	} );

	const isPreview = viewMode === 'preview';
	const hasContent = !! attributes.content?.trim();
	const showPlaceholder = isPreview && ! hasContent;

	// Show placeholder when content is empty and we are in preview mode.
	if ( showPlaceholder ) {
		return (
			<div { ...blockProps }>
				<BlockControls>
					<ViewModeToggle
						viewMode={ viewMode }
						setViewMode={ setViewMode }
					/>
				</BlockControls>
				<Placeholder
					icon={ <BlockIcon icon={ code } /> }
					label={ __( 'Custom HTML' ) }
					instructions={ __(
						'Add custom HTML code and preview how it looks.'
					) }
				>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ () => setIsModalOpen( true ) }
					>
						{ __( 'Edit HTML' ) }
					</Button>
				</Placeholder>
				{ isModalOpen && (
					<HTMLEditModal
						isOpen={ isModalOpen }
						onRequestClose={ () => setIsModalOpen( false ) }
						content={ attributes.content }
						setAttributes={ setAttributes }
					/>
				) }
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ViewModeToggle
					viewMode={ viewMode }
					setViewMode={ setViewMode }
				/>
				<ToolbarGroup>
					<ToolbarButton onClick={ () => setIsModalOpen( true ) }>
						{ __( 'Edit code' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<Stack
					className="block-editor-block-inspector-edit-contents"
					direction="column"
				>
					<Button
						className="block-editor-block-inspector-edit-contents__button"
						__next40pxDefaultSize
						variant="secondary"
						onClick={ () => setIsModalOpen( true ) }
					>
						{ __( 'Edit code' ) }
					</Button>
				</Stack>
			</InspectorControls>
			<div hidden={ isPreview } aria-hidden={ isPreview }>
				<PlainText
					value={ getRawHtml( attributes.content ) }
					onChange={ ( newHtml ) => {
						const { css, js } = parseContent( attributes.content );
						setAttributes( {
							content: serializeContent( {
								html: newHtml,
								css,
								js,
							} ),
						} );
					} }
					placeholder={ __( 'Write HTML…' ) }
					aria-label={ __( 'HTML' ) }
				/>
			</div>
			{ hasContent && (
				<div hidden={ ! isPreview } aria-hidden={ ! isPreview }>
					<Preview
						content={ attributes.content }
						isSelected={ isSelected }
					/>
				</div>
			) }
			{ isModalOpen && (
				<HTMLEditModal
					isOpen={ isModalOpen }
					onRequestClose={ () => setIsModalOpen( false ) }
					content={ attributes.content }
					setAttributes={ setAttributes }
				/>
			) }
		</div>
	);
}
