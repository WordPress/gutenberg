/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

// Initial control values where no block style is set.
const BACKGROUND_DEFAULT_VALUES = {
	backgroundSize: 'auto',
};

const {
	useGlobalStyle,
	useGlobalSetting,
	useGlobalStyleLinks,
	BackgroundPanel: StylesBackgroundPanel,
} = unlock( blockEditorPrivateApis );

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background image value set.
 */
export function hasBackgroundImageValue( style ) {
	return (
		!! style?.background?.backgroundImage?.id ||
		!! style?.background?.backgroundImage?.url ||
		typeof style?.background?.backgroundImage === 'string'
	);
}

export default function BackgroundPanel() {
	const [ style ] = useGlobalStyle( '', undefined, 'user', {
		shouldDecodeEncode: false,
	} );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( '', undefined, 'all', {
		shouldDecodeEncode: false,
	} );
	const _links = useGlobalStyleLinks();
	const [ settings ] = useGlobalSetting( '' );

	const defaultControls = {
		backgroundImage: true,
		backgroundSize:
			hasBackgroundImageValue( style ) ||
			hasBackgroundImageValue( inheritedStyle ),
	};

	return (
		<StylesBackgroundPanel
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
			headerLabel={ __( 'Background' ) }
			defaultValues={ BACKGROUND_DEFAULT_VALUES }
			defaultControls={ defaultControls }
			themeFileURIs={ _links?.[ 'wp:theme-file' ] }
		/>
	);
}
