import { notFound } from '@wordpress/route';
import { getSectionTitles } from './sections';

export const route = {
	beforeLoad( { params }: { params: Record< string, string > } ) {
		if ( ! getSectionTitles()[ params.section ] ) {
			throw notFound();
		}
	},
	title: ( { params }: { params: Record< string, string > } ) =>
		getSectionTitles()[ params.section ],
};
