import {
	getBorderBoxPointTransform,
	getViewportVectorTransform,
	isStyleTransformAxisAligned,
} from './transforms';
import { lock } from './lock-unlock';

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
