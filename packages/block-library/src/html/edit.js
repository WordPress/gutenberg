/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	BlockControls,
	PlainText,
	transformStyles,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	Disabled,
	SandBox,
	ToolbarGroup,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

export default function HTMLEdit( { attributes, setAttributes, isSelected } ) {
	const [ isPreview, setIsPreview ] = useState();

	const styles = useSelect( ( select ) => {
		// Default styles used to unset some of the styles
		// that might be inherited from the editor style.
		const defaultStyles = `
			html,body,:root {
				margin: 0 !important;
				padding: 0 !important;
				overflow: visible !important;
				min-height: auto !important;
			}
		`;

		return [
			defaultStyles,
			...transformStyles(
				select( 'core/block-editor' ).getSettings().styles
			),
		];
	}, [] );

	function switchToPreview() {
		setIsPreview( true );
	}

	function switchToHTML() {
		setIsPreview( false );
	}

	return (
		<div { ...useBlockProps() }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ ! isPreview }
						onClick={ switchToHTML }
					>
						<span>HTML</span>
					</ToolbarButton>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ isPreview }
						onClick={ switchToPreview }
					>
						<span>{ __( 'Preview' ) }</span>
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<Disabled.Consumer>
				{ ( isDisabled ) =>
					isPreview || isDisabled ? (
						<>
							<SandBox
								html={ attributes.content }
								styles={ styles }
							/>
							{ /*	
									An overlay is added when the block is not selected in order to register click events. 
									Some browsers do not bubble up the clicks from the sandboxed iframe, which makes it 
									difficult to reselect the block. 
								*/ }
							{ ! isSelected && (
								<div className="block-library-html__preview-overlay"></div>
							) }
						</>
					) : (
						<PlainText
							value={ attributes.content }
							onChange={ ( content ) =>
								setAttributes( { content } )
							}
							placeholder={ __( 'Write HTML…' ) }
							aria-label={ __( 'HTML' ) }
						/>
					)
				}
			</Disabled.Consumer>
		</div>
	);
}
