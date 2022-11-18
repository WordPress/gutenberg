/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCopyToClipboard } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { useBlockSettingsContext } from './block-settings-dropdown';

export function CopyMenuItem() {
	const { blocks, onCopy } = useBlockSettingsContext();

	const ref = useCopyToClipboard( () => serialize( blocks ), onCopy );
	const copyMenuItemLabel =
		blocks.length > 1 ? __( 'Copy blocks' ) : __( 'Copy block' );
	return <MenuItem ref={ ref }>{ copyMenuItemLabel }</MenuItem>;
}
