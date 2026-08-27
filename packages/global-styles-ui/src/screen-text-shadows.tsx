import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import type { TextShadowPreset } from '@wordpress/global-styles-engine';
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import PresetGroup from './presets/preset-group';
import { usePresets } from './presets/use-presets';
import { useSetting } from './hooks';
import { getNewIndexFromPresets } from './utils';

export const DEFAULT_TEXT_SHADOW = '1px 1px 2px rgba(0, 0, 0, 0.3)';

export default function ScreenTextShadows() {
	const [ defaultEnabled ] = useSetting< boolean >(
		'typography.defaultTextShadowPresets'
	);
	const def = usePresets< TextShadowPreset >(
		'typography.textShadowPresets',
		'default'
	);
	const theme = usePresets< TextShadowPreset >(
		'typography.textShadowPresets',
		'theme'
	);
	const custom = usePresets< TextShadowPreset >(
		'typography.textShadowPresets',
		'custom'
	);

	const addCustomTextShadow = () => {
		const index = getNewIndexFromPresets( custom.presets, 'text-shadow-' );
		custom.setPresets( [
			...custom.presets,
			{
				/* translators: %d: is an index for a preset */
				name: sprintf( __( 'Text Shadow %d' ), index ),
				textShadow: DEFAULT_TEXT_SHADOW,
				slug: `text-shadow-${ index }`,
			},
		] );
	};

	return (
		<>
			<ScreenHeader
				title={ __( 'Text Shadows' ) }
				description={ __(
					'Manage and create text shadow styles for use across the site.'
				) }
			/>
			<ScreenBody>
				<Stack
					direction="column"
					className="global-styles-ui__text-shadows-panel"
					gap="xl"
				>
					{ defaultEnabled && (
						<PresetGroup
							label={ __( 'Default' ) }
							items={ def.presets }
							getEditPath={ ( slug ) =>
								`/typography/text-shadows/edit/default/${ slug }`
							}
						/>
					) }
					{ theme.presets.length > 0 && (
						<PresetGroup
							label={ __( 'Theme' ) }
							items={ theme.presets }
							getEditPath={ ( slug ) =>
								`/typography/text-shadows/edit/theme/${ slug }`
							}
						/>
					) }
					<PresetGroup
						label={ __( 'Custom' ) }
						items={ custom.presets }
						getEditPath={ ( slug ) =>
							`/typography/text-shadows/edit/custom/${ slug }`
						}
						addLabel={ __( 'Add text shadow' ) }
						onAdd={ addCustomTextShadow }
						menuAction={ {
							label: __( 'Remove all custom text shadows' ),
							optionsLabel: __( 'Text shadow options' ),
							confirmText: __(
								'Are you sure you want to remove all custom text shadows?'
							),
							confirmButtonText: __( 'Remove' ),
							onConfirm: () => custom.setPresets( [] ),
						} }
					/>
				</Stack>
			</ScreenBody>
		</>
	);
}
