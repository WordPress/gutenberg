/**
 * External dependencies
 */
import classnames from 'classnames';
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	transformStyles,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Disabled,
	SandBox,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Default styles used to unset some of the styles
// that might be inherited from the editor style.
const DEFAULT_STYLES = `
	html,body,:root {
		margin: 0 !important;
		padding: 0 !important;
		overflow: visible !important;
		min-height: auto !important;
	}
`;

export default function HTMLEdit( { attributes, setAttributes, isSelected } ) {
	const [ isPreview, setIsPreview ] = useState( false );

	const styles = useSelect(
		( select ) => [
			DEFAULT_STYLES,
			...transformStyles(
				select( blockEditorStore ).getSettings().styles
			),
		],
		[]
	);

	function switchToPreview() {
		setIsPreview( true );
	}

	function switchToHTML() {
		setIsPreview( false );
	}

	const blockProps = useBlockProps( {
		className: 'block-library-html__edit',
	} );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						isPressed={ ! isPreview }
						onClick={ switchToHTML }
					>
						HTML
					</ToolbarButton>
					<ToolbarButton
						isPressed={ isPreview }
						onClick={ switchToPreview }
					>
						{ __( 'Preview' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<Disabled.Consumer>
				{ ( isDisabled ) =>
					isPreview || isDisabled ? (
						<div { ...blockProps }>
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
								<div className="block-library-html__preview-overlay" />
							) }
						</div>
					) : (
						<div
							{ ...blockProps }
							className={ classnames(
								blockProps.className,
								'is-html-editor'
							) }
						>
							<TextareaAutosize
								aria-label={ __( 'HTML' ) }
								value={ attributes.content }
								onChange={ ( event ) =>
									setAttributes( {
										content: event.target.value,
									} )
								}
								placeholder={ __( 'Write HTML…' ) }
							/>
						</div>
					)
				}
			</Disabled.Consumer>
		</>
	);
}
