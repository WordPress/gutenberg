/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, Toolbar, PanelBody, ToggleControl, SVG, Rect, Path } from '@wordpress/components';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';

const EmbedControls = ( props ) => {
	const {
		blockSupportsResponsive,
		themeSupportsResponsive,
		allowResponsive,
		getResponsiveHelp,
		toggleResponsive,
		switchBackToURLInput,
		editingURL,
		hasEmbed,
	} = props;
	const editImageIcon = ( <SVG width={ 20 } height={ 20 } viewBox="0 0 20 20"><Rect x={ 11 } y={ 3 } width={ 7 } height={ 5 } rx={ 1 } /><Rect x={ 2 } y={ 12 } width={ 7 } height={ 5 } rx={ 1 } /><Path d="M13,12h1a3,3,0,0,1-3,3v2a5,5,0,0,0,5-5h1L15,9Z" /><Path d="M4,8H3l2,3L7,8H6A3,3,0,0,1,9,5V3A5,5,0,0,0,4,8Z" /></SVG> );
	return (
		<>
			<BlockControls>
				<Toolbar>
					<IconButton
						className={ classnames( 'components-icon-button components-toolbar__control', { 'is-active': ( editingURL || ! hasEmbed ) } ) }
						aria-pressed={ editingURL }
						label={ __( 'Edit URL' ) }
						icon={ editImageIcon }
						onClick={ switchBackToURLInput }
					/>
				</Toolbar>
			</BlockControls>
			{ themeSupportsResponsive && blockSupportsResponsive && (
				<InspectorControls>
					<PanelBody title={ __( 'Media Settings' ) } className="blocks-responsive">
						<ToggleControl
							label={ __( 'Resize for smaller devices' ) }
							checked={ allowResponsive }
							help={ getResponsiveHelp }
							onChange={ toggleResponsive }
						/>
					</PanelBody>
				</InspectorControls>
			) }
		</>
	);
};

export default EmbedControls;
