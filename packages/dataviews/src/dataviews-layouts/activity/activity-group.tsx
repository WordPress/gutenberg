/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

interface ActivityGroupProps< Item > {
	groupName: string;
	groupData: Item[];
	groupField: NormalizedField< Item >;
	showLabel?: boolean;
	children: React.ReactNode;
}

export default function ActivityGroup< Item >( {
	groupName,
	groupData,
	groupField,
	showLabel = true,
	children,
}: ActivityGroupProps< Item > ) {
	// Render group header content - either with or without field label
	const groupHeader = showLabel ? (
		createInterpolateElement(
			// translators: %s: The label of the field e.g. "Status".
			sprintf( __( '%s: <groupName />' ), groupField.label ).trim(),
			{
				groupName: (
					<groupField.render
						item={ groupData[ 0 ] }
						field={ groupField }
					/>
				),
			}
		)
	) : (
		<groupField.render item={ groupData[ 0 ] } field={ groupField } />
	);

	return (
		<Stack
			key={ groupName }
			direction="column"
			className="dataviews-view-activity__group"
		>
			<h3 className="dataviews-view-activity__group-header">
				{ groupHeader }
			</h3>
			{ children }
		</Stack>
	);
}
