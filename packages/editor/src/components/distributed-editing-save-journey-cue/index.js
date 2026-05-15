/**
 * External dependencies
 */
import clsx from 'clsx';

export function getDistributedEditingSaveJourneyDataAttributes(
	saveJourneyState
) {
	if ( ! saveJourneyState?.shouldExposeInSaveControls ) {
		return {};
	}

	return {
		'data-distributed-editing-save-control-journey-step':
			saveJourneyState.step,
		'data-distributed-editing-save-control-journey-action':
			saveJourneyState.action,
		'data-distributed-editing-save-control-journey-authority-state':
			saveJourneyState.statusChromeAuthorityState,
		'data-distributed-editing-save-control-journey-authority-summary':
			saveJourneyState.statusChromeAuthorityText,
		'data-distributed-editing-save-control-journey-descriptor-only': 'true',
		'data-distributed-editing-save-control-journey-calls-normal-save':
			'false',
		'data-distributed-editing-save-control-journey-calls-rest': 'false',
		'data-distributed-editing-save-control-journey-calls-retry-save':
			'false',
		'data-distributed-editing-save-control-journey-changes-post-lock':
			'false',
		'data-distributed-editing-save-control-journey-claims-saved-without-evidence':
			String( Boolean( saveJourneyState.claimsSavedWithoutEvidence ) ),
		'data-distributed-editing-save-control-journey-exposes-proof-internals':
			'false',
		'data-distributed-editing-save-control-journey-exposes-raw-content':
			'false',
		'data-distributed-editing-save-control-journey-mutates-editor-content':
			'false',
		'data-distributed-editing-save-control-journey-mutates-persisted-post-content':
			'false',
		'data-distributed-editing-save-control-journey-status-summary':
			saveJourneyState.statusChromeSummary,
	};
}

export function getDistributedEditingSaveJourneyTitle( saveJourneyState ) {
	if ( ! saveJourneyState?.shouldExposeInSaveControls ) {
		return undefined;
	}

	const summary = saveJourneyState.summary || '';
	const statusSummary = saveJourneyState.statusChromeSummary || '';

	if ( ! summary || ! statusSummary || summary.includes( statusSummary ) ) {
		return summary || statusSummary || undefined;
	}

	return `${ summary } ${ statusSummary }`;
}

export default function DistributedEditingSaveJourneyCue( {
	className,
	saveJourneyState,
} ) {
	if ( ! saveJourneyState?.shouldExposeInSaveControls ) {
		return null;
	}

	const saveJourneyTitle =
		getDistributedEditingSaveJourneyTitle( saveJourneyState );

	return (
		<span
			{ ...getDistributedEditingSaveJourneyDataAttributes(
				saveJourneyState
			) }
			aria-label={ saveJourneyTitle }
			className={ clsx(
				'editor-distributed-editing-save-journey-cue',
				className
			) }
			data-distributed-editing-save-control-journey-compact-affordance="available"
			data-distributed-editing-save-control-journey-visual-cue="true"
			data-distributed-editing-save-control-journey-title={
				saveJourneyState.title
			}
			title={ saveJourneyTitle }
		>
			<span
				aria-hidden="true"
				className="editor-distributed-editing-save-journey-cue__label"
			>
				{ saveJourneyState.title }
			</span>
		</span>
	);
}
