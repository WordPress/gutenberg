/**
 * Finds the subject of an image so a crop can keep it in frame.
 *
 * This entry point carries the types and the pure helpers. The detector itself
 * lives in `@wordpress/subject-detection/detector` and is imported separately,
 * because loading it pulls in an inference runtime that is only worth fetching
 * once an image actually needs cropping.
 */

export type {
	Detection,
	DetectSubjectOptions,
	NormalizedRect,
	SubjectArea,
} from './types';

export { toSubjectArea } from './subject';
export {
	INPUT_SIZE,
	STRIDES,
	decodeDetections,
	getLetterbox,
	imageDataToTensor,
	nonMaximumSuppression,
	toNormalizedDetections,
} from './yunet';
export type { Letterbox, YuNetOutputs } from './yunet';
