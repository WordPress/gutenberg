/**
 * External dependencies
 */
import { times, range, map } from 'lodash';
import classnames from 'classnames';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
	ButtonGroup,
	Button,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import {
	InspectorControls,
	InnerBlocks,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'rows/dynamic';

export const settings = {
	title: 'Dynamic row',

	icon: 'columns',

	category: 'rows',

	attributes: {
		columns: {
			type: 'number',
			default: 2,
		},
		widths: {
			type: 'string',
			default: '6,6',
		},
	},

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you\'d like.' ),

	/* supports: {
		align: [ 'wide', 'full' ],
	},*/

	edit,

	save() {
		return (
			<div className={ 'wp-block-rows' }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
