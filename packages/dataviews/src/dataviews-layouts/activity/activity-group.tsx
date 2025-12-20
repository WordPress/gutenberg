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

interface ActivityGroupProps< Item > {
	groupName: string;
	groupData: Item[];
	groupField: NormalizedField< Item >;
	children: React.ReactNode;
}

export default function ActivityGroup< Item >( {
	groupName,
	groupData,
	groupField,
	children,
}: ActivityGroupProps< Item > ) {
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
		<VStack
			key={ groupName }
			spacing={ 0 }
			className="dataviews-view-activity__group"
		>
			<h3 className="dataviews-view-activity__group-header">
				{ groupHeader }
			</h3>
			{ children }
		</VStack>
	);
}
