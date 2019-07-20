/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const modes = [
	{ value: 'post-content', label: __( '📝 Writing' ), showTemplate: false },
	{ value: 'full-site', label: __( '🦋 Full Site Editing' ), showTemplate: true },
	{ value: 'preview', label: __( '🍿 Preview' ), showTemplate: true },
	{ value: 'focus', label: __( '👁 Focus' ), showTemplate: true },
	{ value: 'design', label: __( '🎨 Design' ), showTemplate: true },
	{ value: 'template', label: __( '📦 Template' ), showTemplate: true },
	{ value: '---', label: __( '---' ), showTemplate: true },
];

export const getModeConfig = ( modeId, dynamicModes = [] ) => {
	return find( [ ...modes, ...dynamicModes ], ( mode ) => mode.value === modeId ) || modes[ 0 ];
};
