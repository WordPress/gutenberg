import { Icon, textColor as textColorIcon } from '@wordpress/icons';

/**
 * The letter with the colour drawn as a line beneath it, as a word processor
 * draws it, so the letter stays legible whatever colour is chosen.
 *
 * @param props       Component props.
 * @param props.color The colour the text renders in.
 */
export default function TextColorIcon( { color }: { color?: string } ) {
	return (
		<span className="editor-typography-toolbar__color-icon">
			<Icon icon={ textColorIcon } />
			<span
				className="editor-typography-toolbar__color-bar"
				data-testid="typography-color-bar"
				// Nothing to show rather than a colour the block has not got.
				style={ { background: color ?? 'transparent' } }
			/>
		</span>
	);
}
