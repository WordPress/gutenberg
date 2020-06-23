/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	FontSizePicker,
	__experimentalLineHeightControl as LineHeightControl,
} from '@wordpress/block-editor';
import { getBlockTypes } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';

export default ( { identifier, title: panelTitle, icon } ) => {
	const {
		__experimentalGlobalStylesUser: userStyles,
	} = useSelect( ( select ) => select( 'core/block-editor' ).getSettings() );

	const fromPx = ( value ) => +value?.replace( 'px', '' ) ?? null;
	const getFontSizeValue = ( blockName ) =>
		fromPx( userStyles?.[ blockName ]?.styles?.typography?.fontSize ) ??
		null;

	const getLineHeightValue = ( blockName ) =>
		userStyles?.[ blockName ]?.styles?.typography?.lineHeight ?? null;

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
										value={ getFontSizeValue( name ) }
										onChange={ () =>
											console.log( 'change font size' )
										}
									/>
								);
							}

							if ( __experimentalLineHeight ) {
								panels.push(
									<LineHeightControl
										value={ getLineHeightValue( name ) }
										onChange={ () =>
											console.log( 'change line height' )
										}
									/>
								);
							}

							return panels.length > 1 ? panels : null;
						}
					)
					.filter( Boolean ) }
			</PanelBody>
		</DefaultSidebar>
	);
};
