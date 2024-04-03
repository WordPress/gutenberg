/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

// Initial control values where no block style is set.
const BACKGROUND_BLOCK_DEFAULT_VALUES = {
	backgroundSize: 'cover',
};

const {
	useGlobalStyle,
	useGlobalSetting,
	BackgroundPanel: StylesBackgroundPanel,
} = unlock( blockEditorPrivateApis );

export default function BackgroundPanel() {
	const [ style ] = useGlobalStyle( '', undefined, 'user', {
		shouldDecodeEncode: false,
	} );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( '', undefined, 'all', {
		shouldDecodeEncode: false,
	} );
	const [ settings ] = useGlobalSetting( '' );

	const defaultControls = {
		backgroundImage: true,
		backgroundSize:
			!! style?.background?.backgroundImage ||
			!! inheritedStyle?.background?.backgroundImage,
	};

	return (
		<StylesBackgroundPanel
			inheritedValue={ inheritedStyle }
			defaultValues={ BACKGROUND_BLOCK_DEFAULT_VALUES }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
			defaultControls={ defaultControls }
		/>
	);
}
