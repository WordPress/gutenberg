/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Gets a list of post data fields with their values and labels
 * to be consumed in the needed callbacks.
 * Falls back to defaults if context is missing.
 *
 * @param {Object} select  The select function from the data store.
 * @param {Object} context The block context.
 * @return {Object|null} List of post data fields with value and label.
 */
function getPostDataFields(select, context) {
	const { getEditedEntityRecord } = select(coreDataStore);

	let entityDataValues = {};
	let dataFields = {};

	// Try to get the current entity data values if context is available
	if (context?.postType && context?.postId) {
		entityDataValues = getEditedEntityRecord(
			'postType',
			context.postType,
			context.postId
		) || {};
	}

	// Define fields we want to expose
	dataFields = {
		title: {
			label: __('Post Title'),
			value: entityDataValues?.title,
			type: 'string',
		},
		status: {
			label: __('Post Status'),
			value: entityDataValues?.status,
			type: 'string',
		},
		date: {
			label: __('Post Date'),
			value: entityDataValues?.date,
			type: 'string',
		},
		modified: {
			label: __('Post Modified Date'),
			value: entityDataValues?.modified,
			type: 'string',
		},
	};

	// Return null if no fields available
	if (!Object.keys(dataFields).length) {
		return null;
	}

	return dataFields;
}

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/post-data',

	getValues({ select, context, bindings }) {
		const dataFields = getPostDataFields(select, context);

		const newValues = {};
		for (const [attributeName, source] of Object.entries(bindings)) {
			// Use the key or linkKey
			const fieldKey = source.args.key ?? source.args.linkKey;
			const { value: fieldValue, label: fieldLabel } = dataFields?.[fieldKey] || {};
			newValues[attributeName] = fieldValue ?? fieldLabel ?? fieldKey;
		}

		return newValues;
	},

	setValues({ dispatch, context, bindings }) {
		const newData = {};
		Object.values(bindings).forEach(({ args, newValue }) => {
			const fieldKey = args.key ?? args.linkKey;
			newData[fieldKey] = newValue;
		});

		dispatch(coreDataStore).editEntityRecord(
			'postType',
			context?.postType,
			context?.postId,
			newData
		);
	},

	canUserEditValue({ select, context, args }) {
		if (context?.query || context?.queryId) {
			return false;
		}
		if (!context?.postType) {
			return false;
		}

		const fieldKey = args.key ?? args.linkKey;
		const fieldValue = getPostDataFields(select, context)?.[fieldKey]?.value;
		if (fieldValue === undefined) {
			return false;
		}

		const canUserEdit = select(coreDataStore).canUser('update', {
			kind: 'postType',
			name: context.postType,
			id: context.postId,
		});
		return !!canUserEdit;
	},

	getFieldsList({ select, context }) {
		return getPostDataFields(select, context);
	},
};

