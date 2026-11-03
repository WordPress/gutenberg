import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { pencil } from '@wordpress/icons';
import type { ToolbarModeSwitchProps } from './types';

/**
 * Swaps the block toolbar between its design tools and its writing tools.
 *
 * @param props          Component props.
 * @param props.mode     The mode the toolbar is in.
 * @param props.onChange Called with the mode to switch to.
 */
export default function ToolbarModeSwitch( {
	mode,
	onChange,
}: ToolbarModeSwitchProps ) {
	return (
		<ToolbarGroup className="block-editor-block-toolbar__mode-switch">
			<ToolbarButton
				icon={ pencil }
				label={ __( 'Write' ) }
				isActive={ mode === 'write' }
				onClick={ () =>
					onChange( mode === 'write' ? 'design' : 'write' )
				}
			/>
		</ToolbarGroup>
	);
}
