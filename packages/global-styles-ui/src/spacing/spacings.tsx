import { __, sprintf } from '@wordpress/i18n';
import type { SpacingSize } from '@wordpress/global-styles-engine';
import { Stack } from '@wordpress/ui';
import { ScreenHeader } from '../screen-header';
import PresetGroup from '../presets/preset-group';
import { usePresets } from '../presets/use-presets';
import { useSetting } from '../hooks';
import { getNewIndexFromPresets } from '../utils';

const hasSameSizeValues = ( a: SpacingSize[], b: SpacingSize[] ): boolean =>
	a.map( ( item ) => item.size ).join( '' ) ===
	b.map( ( item ) => item.size ).join( '' );

const resetMenu = ( onConfirm: () => void ) => ( {
	label: __( 'Reset spacing size presets' ),
	optionsLabel: __( 'Spacing size presets options' ),
	confirmText: __(
		'Are you sure you want to reset all spacing size presets to their default values?'
	),
	confirmButtonText: __( 'Reset' ),
	onConfirm,
} );

export default function Spacings() {
	const [ defaultEnabled ] = useSetting< boolean >(
		'spacing.defaultSpacingSizes'
	);
	const theme = usePresets< SpacingSize >( 'spacing.spacingSizes', 'theme' );
	const def = usePresets< SpacingSize >( 'spacing.spacingSizes', 'default' );
	const custom = usePresets< SpacingSize >(
		'spacing.spacingSizes',
		'custom'
	);

	const addSpacingSize = () => {
		const index = getNewIndexFromPresets( custom.presets, 'custom-' );
		custom.setPresets( [
			...custom.presets,
			{
				/* translators: %d: spacing size index */
				name: sprintf( __( 'New Spacing Size %d' ), index ),
				size: '1rem',
				slug: `custom-${ index }`,
			},
		] );
	};

	return (
		<Stack direction="column" gap="sm">
			<ScreenHeader
				title={ __( 'Spacing size presets' ) }
				description={ __(
					'Create and edit the presets used for spacing sizes across the site.'
				) }
			/>
			<div className="global-styles-ui-spacing-presets__list">
				<Stack direction="column" gap="xl">
					{ !! theme.presets.length && (
						<PresetGroup
							label={ __( 'Theme' ) }
							items={ theme.presets }
							getEditPath={ ( slug ) =>
								`/layout/spacing/theme/${ slug }`
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
								`/layout/spacing/default/${ slug }`
							}
							menuAction={
								hasSameSizeValues(
									def.presets,
									def.basePresets
								)
									? undefined
									: resetMenu( () =>
											def.setPresets( def.basePresets )
									  )
							}
						/>
					) }
					<PresetGroup
						label={ __( 'Custom' ) }
						items={ custom.presets }
						getEditPath={ ( slug ) =>
							`/layout/spacing/custom/${ slug }`
						}
						addLabel={ __( 'Add spacing size' ) }
						onAdd={ addSpacingSize }
						menuAction={
							custom.presets.length > 0
								? {
										label: __(
											'Remove spacing size presets'
										),
										optionsLabel: __(
											'Spacing size presets options'
										),
										confirmText: __(
											'Are you sure you want to remove all custom spacing size presets?'
										),
										confirmButtonText: __( 'Remove' ),
										onConfirm: () =>
											custom.setPresets( [] ),
								  }
								: undefined
						}
					/>
				</Stack>
			</div>
		</Stack>
	);
}
