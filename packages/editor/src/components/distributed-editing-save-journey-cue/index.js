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
	};
}

export default function DistributedEditingSaveJourneyCue( {
	className,
	saveJourneyState,
} ) {
	if ( ! saveJourneyState?.shouldExposeInSaveControls ) {
		return null;
	}

	return (
		<span
			{ ...getDistributedEditingSaveJourneyDataAttributes(
				saveJourneyState
			) }
			className={ clsx(
				'editor-distributed-editing-save-journey-cue',
				className
			) }
			data-distributed-editing-save-control-journey-visual-cue="true"
			data-distributed-editing-save-control-journey-title={
				saveJourneyState.title
			}
			title={ saveJourneyState.summary }
		>
			{ saveJourneyState.title }
		</span>
	);
}
