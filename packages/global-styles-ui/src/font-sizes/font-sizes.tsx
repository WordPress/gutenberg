import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalSpacer as Spacer,
	__experimentalView as View,
} from '@wordpress/components';
import type { FontSize } from '@wordpress/global-styles-engine';
import { Stack } from '@wordpress/ui';
import { ScreenHeader } from '../screen-header';
import PresetGroup from '../presets/preset-group';
import { usePresets } from '../presets/use-presets';
import { useSetting } from '../hooks';
import { getNewIndexFromPresets } from '../utils';

const hasSameSizeValues = ( a: FontSize[], b: FontSize[] ): boolean =>
	a.map( ( item ) => item.size ).join( '' ) ===
	b.map( ( item ) => item.size ).join( '' );

const resetMenu = ( onConfirm: () => void ) => ( {
	label: __( 'Reset font size presets' ),
	optionsLabel: __( 'Font size presets options' ),
	confirmText: __(
		'Are you sure you want to reset all font size presets to their default values?'
	),
	confirmButtonText: __( 'Reset' ),
	onConfirm,
} );

export default function FontSizes() {
	const [ defaultEnabled ] = useSetting< boolean >(
		'typography.defaultFontSizes'
	);
	const theme = usePresets< FontSize >( 'typography.fontSizes', 'theme' );
	const def = usePresets< FontSize >( 'typography.fontSizes', 'default' );
	const custom = usePresets< FontSize >( 'typography.fontSizes', 'custom' );

	const addFontSize = () => {
		const index = getNewIndexFromPresets( custom.presets, 'custom-' );
		custom.setPresets( [
			...custom.presets,
			{
				/* translators: %d: font size index */
				name: sprintf( __( 'New Font Size %d' ), index ),
				size: '16px',
				slug: `custom-${ index }`,
			},
		] );
	};

	return (
		<Stack direction="column" gap="sm">
			<ScreenHeader
				title={ __( 'Font size presets' ) }
				description={ __(
					'Create and edit the presets used for font sizes across the site.'
				) }
			/>
			<View>
				<Spacer paddingX={ 4 }>
					<Stack direction="column" gap="xl">
						{ !! theme.presets.length && (
							<PresetGroup
								label={ __( 'Theme' ) }
								items={ theme.presets }
								getEditPath={ ( slug ) =>
									`/typography/font-sizes/theme/${ slug }`
								}
								menuAction={
									hasSameSizeValues(
										theme.presets,
										theme.basePresets
									)
										? undefined
										: resetMenu( () =>
												theme.setPresets(
													theme.basePresets
												)
										  )
								}
							/>
						) }
						{ defaultEnabled && !! def.presets.length && (
							<PresetGroup
								label={ __( 'Default' ) }
								items={ def.presets }
								getEditPath={ ( slug ) =>
									`/typography/font-sizes/default/${ slug }`
								}
								menuAction={
									hasSameSizeValues(
										def.presets,
										def.basePresets
									)
										? undefined
										: resetMenu( () =>
												def.setPresets(
													def.basePresets
												)
										  )
								}
							/>
						) }
						<PresetGroup
							label={ __( 'Custom' ) }
							items={ custom.presets }
							getEditPath={ ( slug ) =>
								`/typography/font-sizes/custom/${ slug }`
							}
							addLabel={ __( 'Add font size' ) }
							onAdd={ addFontSize }
							menuAction={
								custom.presets.length > 0
									? {
											label: __(
												'Remove font size presets'
											),
											optionsLabel: __(
												'Font size presets options'
											),
											confirmText: __(
												'Are you sure you want to remove all custom font size presets?'
											),
											confirmButtonText: __( 'Remove' ),
											onConfirm: () =>
												custom.setPresets( [] ),
									  }
									: undefined
							}
						/>
					</Stack>
				</Spacer>
			</View>
		</Stack>
	);
}
