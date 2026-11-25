import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
import {
	getBorderBoxPointTransform,
	getViewportVectorTransform,
	isStyleTransformAxisAligned,
} from './transforms';

const { lock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/dom'
);

const lockedApis = {
	getBorderBoxPointTransform,
	getViewportVectorTransform,
	isStyleTransformAxisAligned,
};

export type DOMPrivateApis = typeof lockedApis;

/**
 * Private `@wordpress/dom` APIs.
 *
 * @ignore
 */
export const privateApis = {};
lock( privateApis, lockedApis );
