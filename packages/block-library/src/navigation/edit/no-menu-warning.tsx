import { Warning } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import type { ReactElement } from 'react';

/**
 * Shown in place of a Navigation block that has been told to show no menu
 * (`noFallback`), so it doesn't quietly fall back to the site's newest menu.
 * Choosing a menu, or creating one, ends that state.
 *
 * @param props
 * @param props.chooseMenu The control for choosing or creating a menu.
 */
export default function NoMenuWarning( {
	chooseMenu,
}: {
	chooseMenu: ReactElement;
} ) {
	return (
		<Warning actions={ [ chooseMenu ] }>
			{ __( 'No menu is assigned to this block.' ) }
		</Warning>
	);
}
