/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalSpacer as Spacer,
	__experimentalVStack as VStack,
	__experimentalInputControl as InputControl,
	__experimentalSurface as Surface,
	SelectControl,
	TabPanel,
	Button,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import TabGoogleFontFamilies from './tab-google-font-families';

function LocalFontTab() {
	const fontStyleOptions = [
		{
			label: 'Normal',
			value: 'normal',
		},
		{
			label: 'Italic',
			value: 'italic',
		},
	];

	return (
		<div className="edit-site-global-styles-screen-typography">
			<VStack spacing={ 3 } style={ { alignItems: 'flex-start' } }>
				<InputControl
					accept=".ttf, .woff, .woff2"
					type="file"
					label={ __( 'Font File' ) }
					name="file"
					required
					onChange={ () => {} }
				/>
				<InputControl
					label={ __( 'Font Name' ) }
					name="name"
					placeholder={ __( 'Font Name' ) }
				/>
				<SelectControl
					options={ fontStyleOptions }
					label={ __( 'Font Style' ) }
					name="style"
					required
				/>
				<InputControl
					label={ __( 'Font Weight' ) }
					name="weight"
					placeholder={ __( 'Font Weight' ) }
				/>
				<Spacer />
				<Button variant="primary">Upload Font</Button>
			</VStack>
		</div>
	);
}

function ScreenAddFontFamily( { setGoogleFontSelected } ) {
	return (
		<>
			<ScreenHeader
				title={ __( 'Add Font Family' ) }
				description={ __( 'Add fonts to your site' ) }
			/>

			<TabPanel
				tabs={ [
					{
						name: 'google',
						title: __( 'Google Fonts' ),
					},
					{
						name: 'local',
						title: __( 'Upload' ),
					},
				] }
				initialTabName={ 'google' }
			>
				{ ( tab ) => (
					<Surface>
						{ tab.name === 'local' ? (
							<LocalFontTab />
						) : (
							<TabGoogleFontFamilies
								setGoogleFontSelected={ setGoogleFontSelected }
							/>
						) }
					</Surface>
				) }
			</TabPanel>
		</>
	);
}

export default ScreenAddFontFamily;
