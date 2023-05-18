/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Page from '../page';
import FilterBar from '../filter-bar';
import Table from '../table';

export default function PageMainTemplates() {
	return (
		<Page
			title="Templates"
			subTitle="Manage all your templates"
			actions={ <Button variant="primary">New Template</Button> }
		>
			<FilterBar />
			<Table />
		</Page>
	);
}
