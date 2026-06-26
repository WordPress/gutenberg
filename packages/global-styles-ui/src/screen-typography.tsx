/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { useContext } from '@wordpress/element';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type { GlobalStylesSettings } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import TypographyElements from './typography-elements';
import TypographyVariations from './variations/variations-typography';
import FontFamilies from './font-families';
import FontSizesCount from './font-sizes/font-sizes-count';
import TextShadows from './text-shadows';
import { GlobalStylesContext } from './context';
import { useSetting } from './hooks';
import { unlock } from './lock-unlock';

const { useHasTextShadowControl, useSettingsForBlockElement } = unlock(
	blockEditorPrivateApis
);

function ScreenTypography() {
	const { fontLibraryEnabled } = useContext( GlobalStylesContext );

	const [ rawSettings ] = useSetting< GlobalStylesSettings >( '' );
	const settings = useSettingsForBlockElement( rawSettings );
	const hasTextShadowControl = useHasTextShadowControl( settings );

	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Available fonts, typographic styles, and the application of those styles.'
				) }
			/>
			<ScreenBody>
				<Stack direction="column" gap="xl">
					<TypographyVariations title={ __( 'Typesets' ) } />
					{ fontLibraryEnabled && <FontFamilies /> }
					<TypographyElements />
					<FontSizesCount />
					{ hasTextShadowControl && <TextShadows /> }
				</Stack>
			</ScreenBody>
		</>
	);
}

export default ScreenTypography;
