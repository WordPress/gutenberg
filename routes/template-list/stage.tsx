/**
 * WordPress dependencies
 */
import { stageActivation as TemplateListActivation } from './stage-activation';
import { stageLegacy as TemplateListLegacy } from './stage-legacy';

function TemplateList() {
	// Check if template activation mode is enabled
	const isTemplateActivateEnabled =
		typeof window !== 'undefined' && window.__experimentalTemplateActivate;

	// Route to appropriate component based on flag
	if ( isTemplateActivateEnabled ) {
		return <TemplateListActivation />;
	}

	return <TemplateListLegacy />;
}

export const stage = TemplateList;
