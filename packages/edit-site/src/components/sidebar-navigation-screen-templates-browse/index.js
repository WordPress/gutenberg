/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalUseNavigator as useNavigator,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useHistory } from '../routes';

const config = {
	wp_template: {
		title: __( 'All templates' ),
		description: __(
			'Create new templates, or reset any customizations made to the templates supplied by your theme.'
		),
	},
	wp_template_part: {
		title: __( 'All template parts' ),
		description: __(
			'Create new template parts, or reset any customizations made to the template parts supplied by your theme.'
		),
	},
	page: {
		title: __( 'All pages' ),
		description: __( 'Manage your pages in bulk.' ),
		initialFilter: {
			status: 'publish',
		},
		filters: [
			{
				label: __( 'Status' ),
				key: 'status',
				options: [
					{ label: 'Published', value: 'publish' },
					{ label: 'Draft', value: 'draft' },
					{ label: 'Future', value: 'future' },
					{ label: 'Private', value: 'private' },
					{ label: 'Trashed', value: 'trash' },
				],
			},
		],
	},
};

export default function SidebarNavigationScreenTemplatesBrowse() {
	const {
		params: { postType },
	} = useNavigator();

	const history = useHistory();

	const [ filters, setFilters ] = useState(
		config[ postType ].initialFilter
	);

	const handleClick = ( { key, value } ) => {
		setFilters( { ...filters, [ key ]: value } );
	};

	useEffect( () => {
		history.push( {
			path: '/' + postType + '/all',
			...filters,
		} );
	}, [ filters, history, postType ] );

	return (
		<SidebarNavigationScreen
			title={ config[ postType ].title }
			description={ config[ postType ].description }
			content={
				<>
					{ config[ postType ].filters &&
						config[ postType ].filters.map( ( filter ) => (
							<div key={ filter.label }>
								<h4 className="edit-site-sidebar-navigation-screen__section-heading">
									{ filter.label }
								</h4>
								<ItemGroup>
									{ filter.options.map( ( option ) => (
										<Item
											key={ option.value }
											className={
												'edit-site-sidebar-navigation-item edit-site-sidebar-navigation-item-page'
											}
											onClick={ () =>
												handleClick( {
													key: filter.key,
													value: option.value,
												} )
											}
										>
											{ option.label }
										</Item>
									) ) }
								</ItemGroup>
							</div>
						) ) }
				</>
			}
		/>
	);
}
