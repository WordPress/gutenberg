/**
 * WordPress dependencies
 */
import {
	Button,
	Notice,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { formatValue, getLayerLabel } from './helpers';
import { useUnexplainedOverride } from './use-unexplained-override';

/**
 * Contents of the popover opened from a control's override indicator: the
 * property's cascade, and the action that gives the override up.
 *
 * The indicator only appears on a control that overrides something, so this is
 * always answering "what did I override, and what happens if I undo it?".
 *
 * @param {Object}    props
 * @param {Object[]}  props.entries         Cascade entries, low to high precedence.
 * @param {string}    props.label           Human label for the property.
 * @param {string}    props.blockTitle      Registered title of the block.
 * @param {Object}    props.variationLabels Map of variation slug to label.
 * @param {?Function} props.onReset         Clears the local override.
 * @param {?string}   props.clientId        Selected block client ID.
 * @param {?string}   props.stylePath       Dot-path of the property.
 * @return {Element} Popover contents.
 */
export default function OriginPopover( {
	entries,
	label,
	blockTitle,
	variationLabels,
	onReset,
	clientId,
	stylePath,
} ) {
	const winner = entries.find( ( entry ) => entry.isWinner );
	// Global Styles is not the only thing that can style a block; see
	// `useUnexplainedOverride`.
	const hasUnexplainedOverride = useUnexplainedOverride(
		clientId,
		stylePath,
		winner?.value,
		winner?.layer
	);

	return (
		// Padding is set on the panel itself so the popover matches the colour
		// picker's, which also opts out of the wrapper's padding.
		<DropdownContentWrapper paddingSize="none">
			<div className="block-editor-style-origins__popover">
				<h3 className="block-editor-style-origins__popover-title">
					{ label }
				</h3>

				{ entries.length > 0 && (
					// Highest precedence first: the value in effect leads, and
					// the layers it overrode read downwards beneath it. The
					// `entries` array itself stays low-to-high, since that is
					// the order the cascade is resolved in.
					<ul className="block-editor-style-origins__cascade">
						{ [ ...entries ].reverse().map( ( entry, index ) => (
							<li
								key={ `${ entry.layer }-${ index }` }
								className={
									entry.isWinner
										? 'is-winner'
										: 'is-overridden'
								}
							>
								<span className="block-editor-style-origins__origin">
									{ getLayerLabel(
										entry,
										blockTitle,
										variationLabels
									) }
								</span>
								<span
									className="block-editor-style-origins__value"
									// The shortened form is enough to compare
									// rows at a glance; the exact value stays
									// one hover away.
									title={
										typeof entry.value === 'string' ||
										typeof entry.value === 'number'
											? String( entry.value )
											: undefined
									}
								>
									{ formatValue( entry.value ) }
								</span>
							</li>
						) ) }
					</ul>
				) }

				{ hasUnexplainedOverride && (
					<Notice
						status="warning"
						isDismissible={ false }
						spokenMessage={ null }
						className="block-editor-style-origins__mismatch"
					>
						{ __(
							'Something outside Global Styles is changing this value — custom CSS, the theme, or a plugin.'
						) }
					</Notice>
				) }

				{ !! onReset && (
					<div className="block-editor-style-origins__actions">
						{ /*
						 * "Clear" rather than "Reset to <value>": the cascade
						 * above already shows the value that takes over, so
						 * repeating it on the control made for a long label
						 * that changed every time the value did.
						 */ }
						<Button
							variant="link"
							onClick={ onReset }
							className="block-editor-style-origins__reset"
						>
							{ __( 'Clear' ) }
						</Button>
					</div>
				) }
			</div>
		</DropdownContentWrapper>
	);
}
