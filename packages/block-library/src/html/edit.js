/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	BlockControls,
	BlockIcon,
	useBlockProps,
	PlainText,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToolbarGroup,
	Placeholder,
	Button,
} from '@wordpress/components';
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
 * Using a regex avoids browser-side HTML normalization that breaks typing flow.
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

	const isPreview = ( attributes.viewMode || 'html' ) === 'preview';

	// Show placeholder when content is empty and we are in preview mode
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
						isPressed={ ! isPreview }
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
