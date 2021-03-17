/**
 * WordPress dependencies
 */
import { Card, CardBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AddMenu from '../add-menu';

export default function EmptyState() {
	return (
		<Card className="edit-navigation-empty-state">
			<CardBody>
				<AddMenu
					titleText={ __( 'Create your first menu' ) }
					helpText={ __( 'A short descriptive name for your menu.' ) }
					focusInputOnMount
				/>
			</CardBody>
		</Card>
	);
}
