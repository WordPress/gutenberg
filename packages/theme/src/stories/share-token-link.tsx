import { AnchorMdx } from '@storybook/addon-docs/blocks';
import { Tooltip, VisuallyHidden } from '@wordpress/ui';
import styles from './copy-token-button.module.css';

/**
 * Link to a token's own URL hash, shown as `#` with a "Share link" tooltip.
 * Like the copy button, it is revealed when its token row is hovered or
 * focused (see the `data-token-row` attribute).
 *
 * @param props
 * @param props.id   Id of the token row to link to.
 * @param props.name Token CSS custom property name, included in the link's
 *                   accessible name so the links can be told apart.
 */
export function ShareTokenLink( { id, name }: { id: string; name: string } ) {
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				className={ `${ styles.button } ${ styles.link }` }
				render={ <span /> }
			>
				<AnchorMdx href={ `#${ id }` } target="_self">
					<span aria-hidden="true">#</span>
					{ /* `AnchorMdx` drops `aria-*` props, so name the link with text. */ }
					<VisuallyHidden render={ <span /> }>
						Share link to { name }
					</VisuallyHidden>
				</AnchorMdx>
			</Tooltip.Trigger>
			<Tooltip.Popup>Share link</Tooltip.Popup>
		</Tooltip.Root>
	);
}
