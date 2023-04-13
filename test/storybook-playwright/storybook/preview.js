/**
 * Internal dependencies
 */

import * as basePreviewConfig from '../../../storybook/preview';
import { WithCustomControls } from './decorators/with-custom-controls';

export const globalTypes = {
	...basePreviewConfig.globalTypes,
	customE2EControls: {
		name: 'Custom E2E Controls',
		description:
			'Shows custom UI used by e2e tests for setting props programmatically',
		defaultValue: 'hide',
		toolbar: {
			icon: 'edit',
			items: [
				{ value: 'hide', title: 'Hide' },
				{ value: 'show', title: 'Show' },
			],
		},
	},
};
export const decorators = [
	...basePreviewConfig.decorators,
	WithCustomControls,
];
export const parameters = { ...basePreviewConfig.parameters };
