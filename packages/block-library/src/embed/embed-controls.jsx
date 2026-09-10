import { __ } from '@wordpress/i18n';
import {
	ToolbarButton,
	ToggleControl,
	ToolbarGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { TextareaControl } from '@wordpress/ui';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { pencil } from '@wordpress/icons';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

/**
 * Reads the fallback URLs out of the field: one per line, ignoring blank lines
 * and surrounding whitespace.
 *
 * @param {string} text Field contents.
 *
 * @return {string[]} Fallback URLs.
 */
function parseFallbacks( text ) {
	return text
		.split( '\n' )
		.map( ( line ) => line.trim() )
		.filter( Boolean );
}

/**
 * A line-per-URL field for the block's alternative sources.
 *
 * @param {Object}   props
 * @param {string[]} props.fallbacks    Fallback URLs stored on the block.
 * @param {Function} props.setFallbacks Stores a new list of fallback URLs.
 */
function FallbackURLsControl( { fallbacks, setFallbacks } ) {
	// The field keeps the text as typed. Deriving it from the stored list on
	// every keystroke would drop the blank line the moment Enter is pressed,
	// leaving no way to type a second URL.
	const [ text, setText ] = useState( () => fallbacks.join( '\n' ) );
	const [ storedFallbacks, setStoredFallbacks ] = useState( fallbacks );

	// Adopt the stored list when it changes elsewhere, such as on undo.
	if ( storedFallbacks !== fallbacks ) {
		setStoredFallbacks( fallbacks );
		if ( parseFallbacks( text ).join( '\n' ) !== fallbacks.join( '\n' ) ) {
			setText( fallbacks.join( '\n' ) );
		}
	}

	return (
		<TextareaControl
			label={ __( 'Fallback URLs' ) }
			description={ __(
				'Alternative URLs for the same content, one per line. They are saved with the block so a front end can try them in order if the embed above cannot be played.'
			) }
			value={ text }
			onValueChange={ ( value ) => {
				setText( value );
				setFallbacks( parseFallbacks( value ) );
			} }
		/>
	);
}

function getResponsiveHelp( checked ) {
	return checked
		? __(
				'This embed will preserve its aspect ratio when the browser is resized.'
		  )
		: __(
				'This embed may not preserve its aspect ratio when the browser is resized.'
		  );
}

const EmbedControls = ( {
	blockSupportsResponsive,
	showEditButton,
	themeSupportsResponsive,
	allowResponsive,
	toggleResponsive,
	switchBackToURLInput,
	fallbacks,
	setFallbacks,
} ) => {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ showEditButton && (
						<ToolbarButton
							className="components-toolbar__control"
							label={ __( 'Edit URL' ) }
							icon={ pencil }
							onClick={ switchBackToURLInput }
						/>
					) }
				</ToolbarGroup>
			</BlockControls>
			{ themeSupportsResponsive && blockSupportsResponsive && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Media settings' ) }
						resetAll={ () => {
							toggleResponsive( true );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							label={ __( 'Media settings' ) }
							isShownByDefault
							hasValue={ () => ! allowResponsive }
							onDeselect={ () => {
								toggleResponsive( ! allowResponsive );
							} }
						>
							<ToggleControl
								label={ __( 'Resize for smaller devices' ) }
								checked={ allowResponsive }
								help={ getResponsiveHelp }
								onChange={ toggleResponsive }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>
			) }
			<InspectorControls group="advanced">
				<FallbackURLsControl
					fallbacks={ fallbacks }
					setFallbacks={ setFallbacks }
				/>
			</InspectorControls>
		</>
	);
};

export default EmbedControls;
