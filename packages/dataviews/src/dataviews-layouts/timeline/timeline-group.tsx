/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

interface TimelineGroupProps< Item > {
	groupName: string;
	groupData: Item[];
	groupField: NormalizedField< Item >;
	children: React.ReactNode;
}

export default function TimelineGroup< Item >( {
	groupName,
	groupData,
	groupField,
	children,
}: TimelineGroupProps< Item > ) {
	// Determine if we should show the field label
	const groupHeader = createInterpolateElement(
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
	);

	return (
		<VStack key={ groupName } spacing={ 0 }>
			<h3 className="dataviews-view-timeline__group-header">
				{ groupHeader }
			</h3>
			{ children }
		</VStack>
	);
}
