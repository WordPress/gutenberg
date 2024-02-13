/**
 * WordPress dependencies
 */
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DataViewItem from '../sidebar-dataviews/dataview-item';
import {
	file as fileIcon,
	commentAuthorAvatar as customIcon,
	plugins as pluginIcon,
} from '@wordpress/icons';

export default function DataviewsTemplatesSidebarContent( {
	activeView,
	postType,
	config,
} ) {
	const { records } = useEntityRecords( 'postType', postType, {
		per_page: -1,
	} );

	// TODO: Can we avoid the delay and rerendering stemming from this call by
	// preloading '/wp/v2/users/me'?
	const currentUserId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id,
		[]
	);

	const counts = useMemo( () => {
		if ( records ) {
			const user = { count: 0, name: undefined };
			const plugins = {};

			for ( const template of records ) {
				switch ( template.original_source ) {
					case 'user':
						if ( template.author === currentUserId ) {
							if ( ! user.name ) {
								user.name = template.author_text;
							}
							user.count++;
						}
						break;
					case 'plugin':
						if ( ! plugins[ template.theme ] ) {
							plugins[ template.theme ] = {
								count: 0,
								name: template.author_text,
							};
						}
						plugins[ template.theme ].count++;
						break;
				}
			}

			return { user, plugins };
		}
	}, [ records, currentUserId ] );

	return (
		<ItemGroup>
			<DataViewItem
				slug="all"
				title={ config[ postType ].title }
				icon={ fileIcon }
				isActive={ activeView === 'all' }
				isCustom="false"
				suffix={ <span>{ records?.length }</span> }
			/>
			{ counts && (
				<DataViewItem
					key="user"
					slug={ counts.user.name }
					title={ __( 'My templates' ) }
					icon={ customIcon }
					isActive={ activeView === counts.user.name }
					isCustom="false"
					suffix={ <span>{ counts.user.count }</span> }
				/>
			) }
			{ counts &&
				Object.entries( counts?.plugins ).map(
					( [ key, { count, name } ] ) => (
						<DataViewItem
							key={ key }
							slug={ name }
							title={ name }
							icon={ pluginIcon }
							isActive={ activeView === name }
							isCustom="false"
							suffix={ <span>{ count }</span> }
						/>
					)
				) }
		</ItemGroup>
	);
}
