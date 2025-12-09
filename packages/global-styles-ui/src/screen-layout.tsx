/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type { GlobalStylesSettings } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import DimensionsPanel from './dimensions-panel';
import SpacingsCount from './spacing/spacings-count';
import { hasAvailableSpacingSizes } from './spacing/utils';
import { useSetting } from './hooks';
import { unlock } from './lock-unlock';

const { useHasDimensionsPanel, useSettingsForBlockElement } = unlock(
	blockEditorPrivateApis
);

function ScreenLayout() {
	const [ rawSettings ] = useSetting< GlobalStylesSettings >( '' );
	const settings = useSettingsForBlockElement( rawSettings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasSpacingSizes = hasAvailableSpacingSizes( settings );

	return (
		<>
			<ScreenHeader title={ __( 'Layout' ) } />
			<>
				{ hasDimensionsPanel && <DimensionsPanel /> }
				{ hasSpacingSizes && (
					<div className="global-styles-ui-screen">
						<SpacingsCount />
					</div>
				) }
			</>
		</>
	);
}

export default ScreenLayout;
