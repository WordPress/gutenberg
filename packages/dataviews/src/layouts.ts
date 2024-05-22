/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	blockTable,
	category,
	formatListBullets,
	formatListBulletsRTL,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ViewTable from './view-table';
import ViewGrid from './view-grid';
import ViewList from './view-list';
import {
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
	LayoutType,
} from './constants';
import { ViewProps } from './types';

export function getViewLayout( type: LayoutType ) {
	switch ( type ) {
		case LAYOUT_TABLE:
			return {
				type: LAYOUT_TABLE,
				label: __( 'Table' ),
				component: ViewTable,
				icon: blockTable,
			};
		case LAYOUT_GRID:
			return {
				type: LAYOUT_GRID,
				label: __( 'Grid' ),
				component: ViewGrid,
				icon: category,
			};
		case LAYOUT_LIST:
			return {
				type: LAYOUT_LIST,
				label: __( 'List' ),
				component: ViewList,
				icon: isRTL() ? formatListBulletsRTL : formatListBullets,
			};
	}
}

export const VIEW_LAYOUTS = [
	getViewLayout( LAYOUT_TABLE ),
	getViewLayout( LAYOUT_GRID ),
	getViewLayout( LAYOUT_LIST ),
];
