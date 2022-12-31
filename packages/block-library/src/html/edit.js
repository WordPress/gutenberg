/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import {
	BlockControls,
	PlainText,
	useBlockProps,
} from '@wordpress/block-editor';
import { ToolbarButton, Disabled, ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Preview from './preview';

export default function HTMLEdit( { attributes, setAttributes, isSelected } ) {
	const isDisabled = useContext( Disabled.Context );

	function switchToPreview() {
		setAttributes( { preview: true } );
	}

	function switchToHTML() {
		setAttributes( { preview: false } );
	}

	return (
		<div { ...useBlockProps( { className: 'block-library-html__edit' } ) }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ ! attributes.preview }
						onClick={ switchToHTML }
					>
						HTML
					</ToolbarButton>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ attributes.preview }
						onClick={ switchToPreview }
					>
						{ __( 'Preview' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			{ attributes.preview || isDisabled ? (
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
