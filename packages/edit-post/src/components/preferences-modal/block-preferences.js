/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PreferencesModalSection,
	PreferencesModalFeatureToggle,
} from '@wordpress/interface';

/**
 * Internal dependencies
 */
import BlockManager from '../block-manager';

export default function BlockPreferences() {
	return (
		<>
			<PreferencesModalSection
				title={ __( 'Block interactions' ) }
				description={ __(
					'Customize how you interact with blocks in the block library and editing canvas.'
				) }
			>
				<PreferencesModalFeatureToggle
					scope="core/edit-post"
					feature="mostUsedBlocks"
					help={ __(
						'Places the most frequent blocks in the block library.'
					) }
					label={ __( 'Show most used blocks' ) }
				/>
				<PreferencesModalFeatureToggle
					scope="core/edit-post"
					feature="keepCaretInsideBlock"
					help={ __(
						'Aids screen readers by stopping text caret from leaving blocks.'
					) }
					label={ __( 'Contain text cursor inside block' ) }
				/>
			</PreferencesModalSection>
			<PreferencesModalSection
				title={ __( 'Visible blocks' ) }
				description={ __(
					"Disable blocks that you don't want to appear in the inserter. They can always be toggled back on later."
				) }
			>
				<BlockManager />
			</PreferencesModalSection>
		</>
	);
}
