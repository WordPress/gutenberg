/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useState } from '@wordpress/element';
import {
	BlockControls,
	PlainText,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton, Disabled, ToolbarGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { rawHandler, getBlockContent } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Preview from './preview';

export default function HTMLEdit( {
	attributes,
	setAttributes,
	isSelected,
	clientId,
} ) {
	const [ isPreview, setIsPreview ] = useState();
	const isDisabled = useContext( Disabled.Context );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { getBlock } = useSelect( blockEditorStore );

	function switchToPreview() {
		setIsPreview( true );
	}

	function switchToHTML() {
		setIsPreview( false );
	}

	return (
		<div { ...useBlockProps( { className: 'block-library-html__edit' } ) }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ ! isPreview }
						onClick={ switchToHTML }
					>
						HTML
					</ToolbarButton>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ isPreview }
						onClick={ switchToPreview }
					>
						{ __( 'Preview' ) }
					</ToolbarButton>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarButton
						onClick={ () =>
							replaceBlocks(
								clientId,
								rawHandler( {
									HTML: getBlockContent(
										getBlock( clientId )
									),
								} )
							)
						}
					>
						{ __( 'Convert to blocks' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			{ isPreview || isDisabled ? (
				<Preview
					content={ attributes.content }
					isSelected={ isSelected }
				/>
			) : (
				<PlainText
					value={ attributes.content }
					onChange={ ( content ) => setAttributes( { content } ) }
					placeholder={ __( 'Write HTML…' ) }
					aria-label={ __( 'HTML' ) }
				/>
			) }
		</div>
	);
}
