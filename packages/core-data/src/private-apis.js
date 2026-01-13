/**
 * Internal dependencies
 */
import { useEntityRecordsWithPermissions } from './hooks/use-entity-records';
import { RECEIVE_INTERMEDIATE_RESULTS } from './utils';
import { lock } from './lock-unlock';
import {
	extractFootnotesForCopy,
	mergeFootnotesOnPaste,
} from './footnotes/copy-paste';
import getFootnotesOrder from './footnotes/get-footnotes-order';
import updateBlocksAttributesForNumbering from './footnotes/update-blocks-attributes-for-numbering';

export const privateApis = {};
lock( privateApis, {
	useEntityRecordsWithPermissions,
	RECEIVE_INTERMEDIATE_RESULTS,
	extractFootnotesForCopy,
	mergeFootnotesOnPaste,
	getFootnotesOrder,
	updateBlocksAttributesForNumbering,
} );
