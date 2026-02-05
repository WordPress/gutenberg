/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __experimentalText as Text } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import {
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
	LAYOUT_ACTIVITY,
} from '../../constants';
import type { View } from '../../types';
import { actions, fields } from './fixtures';

const PlanetIllustration = () => (
	<svg
		width="120"
		height="120"
		viewBox="0 0 120 120"
		fill="none"
		style={ { opacity: 0.6 } }
	>
		<circle cx="60" cy="60" r="35" fill="#9ca3af" />
		<ellipse
			cx="60"
			cy="60"
			rx="55"
			ry="12"
			stroke="#9ca3af"
			strokeWidth="3"
			fill="none"
		/>
	</svg>
);
const CustomEmptyComponent = () => (
	<Stack direction="column" align="center" justify="center" gap="md">
		<PlanetIllustration />
		<Text>No celestial bodies found</Text>
	</Stack>
);

const EmptyComponent = ( {
	customEmpty,
	containerHeight,
	isLoading,
}: {
	customEmpty?: boolean;
	containerHeight?: 'auto' | '50vh' | '100vh';
	isLoading?: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: {
			styles: {
				satellites: {
					align: 'end' as const,
				},
			},
		},
		filters: [],
		fields: [ 'title', 'description', 'categories' ],
	} );

	return (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				height: containerHeight,
			} }
		>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ { totalItems: 0, totalPages: 0 } }
				data={ [] }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				actions={ actions }
				defaultLayouts={ {
					[ LAYOUT_TABLE ]: {},
					[ LAYOUT_GRID ]: {},
					[ LAYOUT_LIST ]: {},
					[ LAYOUT_ACTIVITY ]: {},
				} }
				isLoading={ isLoading }
				empty={ customEmpty ? <CustomEmptyComponent /> : undefined }
			/>
		</div>
	);
};

export default EmptyComponent;
