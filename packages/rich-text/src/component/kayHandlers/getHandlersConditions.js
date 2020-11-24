/**
 * WordPress dependencies
 */
import {areHandlingSpaceConditionsMet} from '@wordpress/packages/rich-text/src/component/kayHandlers/spaceHandler';
import {areHorizontalNavigationConditionsMet} from '@wordpress/packages/rich-text/src/component/kayHandlers/horizontalNavigationHandler';

export const getHandlersConditions = ( {
	recordData,
	getDirection,
	isElementAListItem,
	currentRecord,
	event,
} ) => ( {
	areHandlingSpaceConditionsMet: areHandlingSpaceConditionsMet( {
		recordData,
		getDirection,
		isElementAListItem,
		currentRecord,
	} ),
	areHorizontalNavigationConditionsMet: areHorizontalNavigationConditionsMet(
		{
			currentRecord,
			event,
			getDirection,
		}
	),
} );
