/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

import {
	ColorControl,
	Panel,
	PanelBody,
	RangeControl,
} from '@wordpress/components';

export default function GlobalStylesPanel() {
	// TODO: Replace with data/actions from wp.data
	const [ fontSize, setFontSize ] = useState( 16 );
	const [ fontScale, setFontScale ] = useState( 1.2 );
	const [ lineHeight, setLineHeight ] = useState( 1.5 );

	const [ textColor, setTextColor ] = useState( '#000000' );
	const [ backgroundColor, setBackgroundColor ] = useState( '#ffffff' );
	const [ primaryColor, setPrimaryColor ] = useState( '#0000ff' );

	return (
		<Panel header={ __( 'Global Styles' ) }>
			<PanelBody title={ __( 'Typography' ) } initialOpen={ false }>
				<RangeControl
					label={ __( 'Font Size' ) }
					value={ fontSize }
					min={ 10 }
					max={ 30 }
					step={ 1 }
					onChange={ setFontSize }
				/>
				<RangeControl
					label={ __( 'Font Scale' ) }
					value={ fontScale }
					min={ 1.1 }
					max={ 1.4 }
					step={ 0.025 }
					onChange={ setFontScale }
				/>
				<RangeControl
					label={ __( 'Line Height' ) }
					value={ lineHeight }
					min={ 1 }
					max={ 2 }
					step={ 0.1 }
					onChange={ setLineHeight }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Colors' ) } initialOpen={ false }>
				<ColorControl
					label={ __( 'Text' ) }
					value={ textColor }
					onChange={ setTextColor }
				/>
				<ColorControl
					label={ __( 'Background' ) }
					value={ backgroundColor }
					onChange={ setBackgroundColor }
				/>
				<ColorControl
					label={ __( 'Primary' ) }
					value={ primaryColor }
					onChange={ setPrimaryColor }
				/>
			</PanelBody>
		</Panel>
	);
}
