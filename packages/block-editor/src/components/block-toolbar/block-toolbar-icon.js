/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import BlockSwitcher from '../block-switcher';
import BlockIcon from '../block-icon';
import PatternOverridesDropdown from './pattern-overrides-dropdown';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

export default function BlockToolbarIcon( {
	clientIds,
	icon,
	hasBlockStyles,
	variant = 'default',
	isSynced,
	showBlockTitle,
} ) {
	const blockTitle = useBlockDisplayTitle( {
		clientId: clientIds?.[ 0 ],
		maximumLength: 35,
	} );
	const isSingleBlock = clientIds.length === 1;
	const label = isSingleBlock ? blockTitle : __( 'Multiple blocks selected' );
	const BlockIconElement = <BlockIcon icon={ icon } />;

	if ( variant === 'switcher' ) {
		return (
			<BlockSwitcher
				clientIds={ clientIds }
				hasBlockStyles={ hasBlockStyles }
				isSynced={ isSynced }
				label={ label }
				text={ showBlockTitle && blockTitle ? blockTitle : undefined }
			>
				{ BlockIconElement }
			</BlockSwitcher>
		);
	}

	if ( variant === 'pattern-overrides' ) {
		return (
			<PatternOverridesDropdown
				icon={ BlockIconElement }
				clientIds={ clientIds }
				blockTitle={ blockTitle }
			/>
		);
	}

	return (
		<ToolbarButton
			disabled
			className="block-editor-block-toolbar__block-icon"
			title={ label }
			icon={ BlockIconElement }
			text={ showBlockTitle && blockTitle ? blockTitle : undefined }
		/>
	);
}
