/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __experimentalHasSplitBorders as hasSplitBorders } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';

const {
	useGlobalStyle,
	useGlobalSetting,
	useSettingsForBlockElement,
	BorderPanel: StylesBorderPanel,
} = unlock( blockEditorPrivateApis );

export default function BorderPanel( { name, variation = '' } ) {
	let prefixParts = [];
	if ( variation ) {
		prefixParts = [ 'variations', variation ].concat( prefixParts );
	}
	const prefix = prefixParts.join( '.' );

	const [ style ] = useGlobalStyle( prefix, name, 'user', false );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( prefix, name, 'all', {
		shouldDecodeEncode: false,
	} );
	const [ rawSettings ] = useGlobalSetting( '', name );
	const settings = useSettingsForBlockElement( rawSettings, name );

	const onChange = ( newStyle ) => {
		// As Global Styles can't conditionally generate styles based on if
		// other style properties have been set, we need to force split
		// border definitions for user set global border styles. Border
		// radius is derived from the same property i.e. `border.radius` if
		// it is a string that is used. The longhand border radii styles are
		// only generated if that property is an object.
		//
		// For borders (color, style, and width) those are all properties on
		// the `border` style property. This means if the theme.json defined
		// split borders and the user condenses them into a flat border or
		// vice-versa we'd get both sets of styles which would conflict.
		const { border } = newStyle;
		const updatedBorder = ! hasSplitBorders( border )
			? {
					top: border,
					right: border,
					bottom: border,
					left: border,
			  }
			: {
					color: null,
					style: null,
					width: null,
					...border,
			  };

		setStyle( { ...newStyle, border: updatedBorder } );
	};

	return (
		<StylesBorderPanel
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ onChange }
			settings={ settings }
		/>
	);
}
