import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import PresetGroup from './presets/preset-group';
import { usePresets } from './presets/use-presets';
import { useSetting } from './hooks';
import { getNewIndexFromPresets } from './utils';

export const defaultShadow = '6px 6px 9px rgba(0, 0, 0, 0.2)';

interface ShadowPreset {
	name: string;
	slug: string;
	shadow: string;
}

export default function ShadowsPanel() {
	const [ defaultEnabled ] = useSetting< boolean >( 'shadow.defaultPresets' );
	const def = usePresets< ShadowPreset >( 'shadow.presets', 'default' );
	const theme = usePresets< ShadowPreset >( 'shadow.presets', 'theme' );
	const custom = usePresets< ShadowPreset >( 'shadow.presets', 'custom' );

	const addCustomShadow = () => {
		const index = getNewIndexFromPresets( custom.presets, 'shadow-' );
		custom.setPresets( [
			...custom.presets,
			{
				/* translators: %d: is an index for a preset */
				name: sprintf( __( 'Shadow %d' ), index ),
				shadow: defaultShadow,
				slug: `shadow-${ index }`,
			},
		] );
	};

	return (
		<>
			<ScreenHeader
				title={ __( 'Shadows' ) }
				description={ __(
					'Manage and create shadow styles for use across the site.'
				) }
			/>
			<ScreenBody>
				<Stack
					direction="column"
					className="global-styles-ui__shadows-panel"
					gap="xl"
				>
					{ defaultEnabled && (
						<PresetGroup
							label={ __( 'Default' ) }
							items={ def.presets }
							getEditPath={ ( slug ) =>
								`/shadows/edit/default/${ slug }`
							}
						/>
					) }
					{ theme.presets.length > 0 && (
						<PresetGroup
							label={ __( 'Theme' ) }
							items={ theme.presets }
							getEditPath={ ( slug ) =>
								`/shadows/edit/theme/${ slug }`
							}
						/>
					) }
					<PresetGroup
						label={ __( 'Custom' ) }
						items={ custom.presets }
						getEditPath={ ( slug ) =>
							`/shadows/edit/custom/${ slug }`
						}
						addLabel={ __( 'Add shadow' ) }
						onAdd={ addCustomShadow }
						menuAction={ {
							label: __( 'Remove all custom shadows' ),
							optionsLabel: __( 'Shadow options' ),
							confirmText: __(
								'Are you sure you want to remove all custom shadows?'
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
