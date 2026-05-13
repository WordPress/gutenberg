/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type {
	GlobalStylesStyles,
	GlobalStylesSettings,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import Palette from './palette';
import { useStyle, useSetting } from './hooks';
import { unlock } from './lock-unlock';

const { useSettingsForBlockElement, ColorPanel: StylesColorPanel } = unlock(
	blockEditorPrivateApis
);

function ScreenColors() {
	// Get user styles for editing
	const [ style, setStyle ] = useStyle< GlobalStylesStyles >(
		'',
		undefined,
		'user',
		false
	);
	// Get inherited styles for display
	const [ inheritedStyle ] = useStyle< GlobalStylesStyles >(
		'',
		undefined,
		'merged',
		false
	);
	// Get settings for the color panel
	const [ rawSettings ] = useSetting< GlobalStylesSettings >( '' );
	const settings = useSettingsForBlockElement( rawSettings );

	return (
		<>
			<ScreenHeader
				title={ __( 'Colors' ) }
				description={ __(
					'Palette colors and the application of those colors on site elements.'
				) }
			/>
			<ScreenBody>
				<VStack spacing={ 7 }>
					<Palette />
				</VStack>
			</ScreenBody>
			<StylesColorPanel
				inheritedValue={ inheritedStyle }
				value={ style }
				onChange={ setStyle }
				settings={ settings }
			/>
		</>
	);
}

export default ScreenColors;
