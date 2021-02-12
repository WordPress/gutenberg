/**
 * WordPress dependencies
 */
import { Card, CardBody, Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import AddMenu from '../add-menu';

export default function EmptyState( { isPending } ) {
	return (
		<div className="edit-navigation-empty-state">
			{ isPending && <Spinner /> }
			{ ! isPending && (
				<Card className="edit-navigation-empty-state__card">
					<CardBody>
						<AddMenu />
					</CardBody>
				</Card>
			) }
		</div>
	);
}
