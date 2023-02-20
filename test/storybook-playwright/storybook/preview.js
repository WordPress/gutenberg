/**
 * Internal dependencies
 */

import * as basePreviewConfig from '../../../storybook/preview';
import { WithCustomControls } from './decorators/with-custom-controls';

export const globalTypes = { ...basePreviewConfig.globalTypes };
export const decorators = [
	...basePreviewConfig.decorators,
	WithCustomControls,
];
export const parameters = { ...basePreviewConfig.parameters };
