/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	__experimentalLineHeightControl as LineHeightControl,
	FontSizePicker,
	PanelColorSettings,
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
		getBackgroundColor,
		setBackgroundColor,
		getTextColor,
		setTextColor,
		getLinkColor,
		setLinkColor,
	} = useGlobalStylesContext();

	return (
		<DefaultSidebar
			identifier={ identifier }
			title={ panelTitle }
			icon={ icon }
		>
			<PanelBody title={ __( 'Typography' ) }>
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

			<PanelBody title={ __( 'Color' ) } initialOpen={ true }>
				{ getBlockTypes()
					.map(
						( {
							name,
							title,
							supports: { __experimentalColor },
						} ) => {
							const settings = [];
							if ( __experimentalColor ) {
								settings.push( {
									value: getTextColor( name ),
									onChange: ( value ) =>
										setTextColor( name, value ),
									label: __( 'Text color' ),
								} );
								settings.push( {
									value: getBackgroundColor( name ),
									onChange: ( value ) =>
										setBackgroundColor( name, value ),
									label: __( 'Background color' ),
								} );
							}

							if ( __experimentalColor?.gradients ) {
								// TODO: do gradients
							}

							if ( __experimentalColor?.linkColor ) {
								settings.push( {
									value: getLinkColor( name ),
									onChange: ( value ) =>
										setLinkColor( name, value ),
									label: __( 'Link color' ),
								} );
							}

							if ( settings.length > 0 ) {
								return (
									<PanelColorSettings
										title={ title }
										colorSettings={ settings }
									/>
								);
							}

							return null;
						}
					)
					.filter( Boolean ) }
			</PanelBody>
		</DefaultSidebar>
	);
};
