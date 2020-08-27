/**
 * WordPress dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { GLOBAL_CONTEXT, BACKGROUND_COLOR, LINK_COLOR } from '../editor/utils';
import TypographyPanel from './typography-panel';

export default ( { context, getProperty, setProperty } ) => {
	const panels = [];
	const { supports } = context;

	panels.push(
		<TypographyPanel
			context={ { supports, name: GLOBAL_CONTEXT } }
			getProperty={ getProperty }
			setProperty={ setProperty }
		/>
	);

	const colorSettings = [];

	if ( supports.includes( BACKGROUND_COLOR ) ) {
		colorSettings.push( {
			value: getProperty( GLOBAL_CONTEXT, 'color', 'background' ),
			onChange: ( value ) =>
				setProperty( GLOBAL_CONTEXT, 'color', 'background', value ),
			label: __( 'Background color' ),
		} );
	}

	if ( supports.includes( LINK_COLOR ) ) {
		colorSettings.push( {
			value: getProperty( GLOBAL_CONTEXT, 'color', 'link' ),
			onChange: ( value ) =>
				setProperty( GLOBAL_CONTEXT, 'color', 'link', value ),
			label: __( 'Link color' ),
		} );
	}

	if ( colorSettings.length > 0 ) {
		panels.push(
			<PanelColorSettings
				title={ __( 'Color' ) }
				colorSettings={ colorSettings }
			/>
		);
	}

	return panels.filter( Boolean );
};
