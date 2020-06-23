/**
 * WordPress dependencies
 */
import { ColorPalette, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	FontSizePicker,
	__experimentalLineHeightControl as LineHeightControl,
} from '@wordpress/block-editor';
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { useGlobalStylesContext } from '../editor/global-styles-provider';

export default ( { identifier, title: panelTitle, icon } ) => {
	const {
		getFontSize,
		setFontSize,
		getLineHeight,
		setLineHeight,
	} = useGlobalStylesContext();

	return (
		<DefaultSidebar
			identifier={ identifier }
			title={ panelTitle }
			icon={ icon }
		>
			<PanelBody title={ __( 'Typography' ) } initialOpen={ true }>
				{ getBlockTypes()
					.map(
						( {
							name,
							title,
							supports: {
								__experimentalFontSize,
								__experimentalLineHeight,
							},
						} ) => {
							const panels = [];
							panels.push( <h3>{ title }</h3> );

							if ( __experimentalFontSize ) {
								panels.push(
									<FontSizePicker
										value={ getFontSize( name ) }
										onChange={ ( value ) =>
											setFontSize( name, value )
										}
									/>
								);
							}

							if ( __experimentalLineHeight ) {
								panels.push(
									<LineHeightControl
										value={ getLineHeight( name ) }
										onChange={ ( value ) =>
											setLineHeight( name, value )
										}
									/>
								);
							}

							return panels.length > 1 ? panels : null;
						}
					)
					.filter( Boolean ) }
			</PanelBody>
			<PanelBody title={ __( 'Color' ) } initialOpen={ false }>
				{ getBlockTypes()
					.map(
						( {
							name,
							title,
							supports: { __experimentalColor },
						} ) => {
							const panels = [];
							panels.push( <h3>{ title }</h3> );

							if ( __experimentalColor ) {
								// TODO: text & background color
								panels.push(
									<ColorPalette
										colors={ [
											{ name: 'red', color: '#f00' },
											{ name: 'white', color: '#fff' },
											{ name: 'blue', color: '#00f' },
										] }
										value={ '#f00' }
										onChange={ () =>
											console.log( 'change color' )
										}
									/>
								);
							}

							if ( __experimentalColor?.gradients ) {
								// TODO: do gradients
							}

							if ( __experimentalColor?.linkColor ) {
								// TODO: do link color
							}

							return panels.length > 1 ? panels : null;
						}
					)
					.filter( Boolean ) }
			</PanelBody>
		</DefaultSidebar>
	);
};
