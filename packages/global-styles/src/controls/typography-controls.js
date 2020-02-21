/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl } from '@wordpress/components';

export default function TypographyControls( {
	typography: {
		fontBase,
		fontScale,
		lineHeightBase,
		lineHeightHeading,
		fontWeightBase,
		fontWeightHeading,
	},
	setTypography,
} ) {
	return (
		<PanelBody title={ __( 'Typography' ) } initialOpen={ false }>
			<RangeControl
				label={ __( 'Font Base' ) }
				value={ fontBase }
				min={ 10 }
				max={ 30 }
				step={ 1 }
				onChange={ ( value ) => setTypography( { fontBase: value } ) }
			/>
			<RangeControl
				label={ __( 'Font Scale' ) }
				value={ fontScale }
				min={ 1.1 }
				max={ 1.4 }
				step={ 0.025 }
				onChange={ ( value ) => setTypography( { fontScale: value } ) }
			/>
			<h2>Heading</h2>
			<RangeControl
				label={ __( 'Line Height' ) }
				value={ lineHeightHeading }
				min={ 1 }
				max={ 2 }
				step={ 0.1 }
				onChange={ ( value ) =>
					setTypography( { lineHeightHeading: value } )
				}
			/>
			<RangeControl
				label={ __( 'Font Weight' ) }
				value={ fontWeightHeading }
				min={ 100 }
				max={ 900 }
				step={ 100 }
				onChange={ ( value ) =>
					setTypography( { fontWeightHeading: value } )
				}
			/>
			<h2>Base</h2>
			<RangeControl
				label={ __( 'Line Height' ) }
				value={ lineHeightBase }
				min={ 1 }
				max={ 2 }
				step={ 0.1 }
				onChange={ ( value ) =>
					setTypography( { lineHeightBase: value } )
				}
			/>
			<RangeControl
				label={ __( 'Font Weight' ) }
				value={ fontWeightBase }
				min={ 100 }
				max={ 900 }
				step={ 100 }
				onChange={ ( value ) =>
					setTypography( { fontWeightBase: value } )
				}
			/>
		</PanelBody>
	);
}
