/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Pagination from '../';

const meta = {
	title: 'BlockEditor/Pagination',
	component: Pagination,
	tags: [ 'status-private' ],
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Pagination component for navigating through pages of items. Supports full mode (with numPages) and simplified mode (with hasMore only).',
			},
		},
	},
	argTypes: {
		currentPage: {
			control: { type: 'number', min: 1 },
			description: 'The current page number (1-based).',
		},
		numPages: {
			control: { type: 'number', min: 1 },
			description:
				'Total number of pages. Enables full mode with first/last buttons and page indicator.',
		},
		hasMore: {
			control: 'boolean',
			description:
				'Whether more pages exist. Used in simplified mode when totals are unknown.',
		},
		disabled: {
			control: 'boolean',
			description: 'Whether all pagination controls are disabled.',
		},
	},
};

export default meta;

export const FullPagination = {
	render: function Template( { onChange, ...args } ) {
		const [ page, setPage ] = useState( 1 );
		return (
			<Pagination
				{ ...args }
				currentPage={ page }
				numPages={ 5 }
				changePage={ ( newPage ) => {
					setPage( newPage );
					onChange?.( newPage );
				} }
			/>
		);
	},
	args: {
		disabled: false,
	},
};

export const SimplifiedPagination = {
	render: function Template( { onChange, hasMore: hasMoreArg, ...args } ) {
		const [ page, setPage ] = useState( 1 );
		return (
			<Pagination
				{ ...args }
				currentPage={ page }
				hasMore={ hasMoreArg }
				changePage={ ( newPage ) => {
					setPage( newPage );
					onChange?.( newPage );
				} }
			/>
		);
	},
	args: {
		hasMore: true,
		disabled: false,
	},
};

export const Disabled = {
	render: function Template( args ) {
		return (
			<Pagination
				{ ...args }
				currentPage={ 2 }
				numPages={ 5 }
				changePage={ () => {} }
				disabled
			/>
		);
	},
};
