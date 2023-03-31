/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRegisterShortcuts from './use-register-shortcuts';
import Header from './header';
import Table from './table';
import { useLocation } from '../routes';
import useTitle from '../routes/use-title';
import ViewBar from './view-bar';
import Grid from './grid';

export default function List() {
	const {
		params: { path, ...filters },
	} = useLocation();

	const [ viewType, setViewType ] = useState( 'list' );

	let templateType = 'wp_template';

	switch ( path ) {
		case '/wp_template_part/all':
			templateType = 'wp_template_part';
			break;
		case '/wp_template/all':
			templateType = 'wp_template';
			break;
		case '/page/all':
			templateType = 'page';
			break;
	}

	useRegisterShortcuts();

	const postType = useSelect(
		( select ) => select( coreStore ).getPostType( templateType ),
		[ templateType ]
	);

	useTitle( postType?.labels?.name );

	return (
		<div className="edit-site-layout__content-area">
			<Header templateType={ templateType } />
			<ViewBar onViewChange={ setViewType } viewType={ viewType } />
			{ viewType === 'list' ? (
				<Table templateType={ templateType } filters={ filters } />
			) : (
				<Grid templateType={ templateType } filters={ filters } />
			) }
		</div>
	);
}
