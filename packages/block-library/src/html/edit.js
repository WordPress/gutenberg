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

export default function HTMLEdit( { attributes, setAttributes, isSelected } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const blockProps = useBlockProps( {
		className: 'block-library-html__edit',
	} );

	const viewMode = attributes.viewMode === 'preview' ? 'preview' : 'html';
	const isPreview = viewMode === 'preview';

	// Show placeholder when content is empty and we are in preview mode.
	if ( isPreview && ! attributes.content?.trim() ) {
		return (
			<div { ...blockProps }>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							isPressed={ false }
							onClick={ () =>
								setAttributes( { viewMode: 'html' } )
							}
						>
							HTML
						</ToolbarButton>
						<ToolbarButton
							isPressed
							onClick={ () =>
								setAttributes( { viewMode: 'preview' } )
							}
						>
							{ __( 'Preview' ) }
						</ToolbarButton>
					</ToolbarGroup>
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
				<ToolbarGroup>
					<ToolbarButton
						isPressed={ viewMode === 'html' }
						onClick={ () => setAttributes( { viewMode: 'html' } ) }
					>
						HTML
					</ToolbarButton>
					<ToolbarButton
						isPressed={ isPreview }
						onClick={ () =>
							setAttributes( { viewMode: 'preview' } )
						}
					>
						{ __( 'Preview' ) }
					</ToolbarButton>
				</ToolbarGroup>
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
			{ isPreview ? (
				<Preview
					content={ attributes.content }
					isSelected={ isSelected }
				/>
			) : (
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
