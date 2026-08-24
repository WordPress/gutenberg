/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { canRestoreItems, REASON_LABELS } from './review-data';

/**
 * One conflict group (a unit of edits set aside together): attribution,
 * reason, and the lost content. Resolution verbs are Adopt (take the set-
 * aside edit) and Reject (discard it) — the pending-edit vocabulary. When
 * `onNavigate` is given, the attribution becomes a link to the conflicted
 * block. With `summaryOnly` the group renders no verbs: it is an index
 * entry, and resolution happens at the inline block card.
 *
 * @param {Object}   props
 * @param {Array}    props.items         The group's review items.
 * @param {Function} props.onResolve     ( items, resolution ) => void.
 * @param {Function} [props.onNavigate]  Jump to the conflicted block.
 * @param {boolean}  [props.summaryOnly] Render without resolution verbs.
 */
export default function ReviewGroup( {
	items,
	onResolve,
	onNavigate,
	summaryOnly,
} ) {
	const [ first ] = items;
	const attribution = first.isLocal
		? __( 'One of your edits was set aside.' )
		: __( 'A collaborator’s edit was set aside.' );
	const restorable = canRestoreItems( items );
	const isApproval = 'requires-approval' === first.reason;
	let reason = REASON_LABELS[ first.reason ];
	if ( isApproval && ! summaryOnly ) {
		reason = restorable
			? `${ reason } ${ __(
					'Adopting it publishes the content under your account.'
			  ) }`
			: `${ reason } ${ __(
					'Only someone allowed to publish unfiltered HTML can adopt it.'
			  ) }`;
	}
	const summaries = items
		.map( ( item ) => item.summary ?? item.excerpt )
		.filter( Boolean );

	return (
		<div className="editor-collaboration-review-panel__item">
			<p className="editor-collaboration-review-panel__attribution">
				{ onNavigate ? (
					<Button
						__next40pxDefaultSize
						variant="link"
						onClick={ onNavigate }
						label={ __( 'Go to the conflicted block' ) }
						showTooltip
					>
						{ attribution }
					</Button>
				) : (
					attribution
				) }{ ' ' }
				{ reason }
			</p>
			{ summaries.length > 0 && (
				<p className="editor-collaboration-review-panel__summary">
					{ sprintf(
						/* translators: %s: the content of the edit that was set aside. */
						__( 'Lost content: “%s”' ),
						summaries.join( ' ' )
					) }
				</p>
			) }
			{ ! summaryOnly && (
				<div className="editor-collaboration-review-panel__actions">
					{ restorable && (
						<Button
							__next40pxDefaultSize
							size="compact"
							variant="secondary"
							onClick={ () => onResolve( items, 'restored' ) }
						>
							{ __( 'Adopt' ) }
						</Button>
					) }
					<Button
						__next40pxDefaultSize
						size="compact"
						variant="tertiary"
						isDestructive
						onClick={ () => onResolve( items, 'dismissed' ) }
					>
						{ __( 'Reject' ) }
					</Button>
				</div>
			) }
		</div>
	);
}
