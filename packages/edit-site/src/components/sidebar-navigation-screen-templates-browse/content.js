/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DataViewItem from '../sidebar-dataviews/dataview-item';
import {
	file as fileIcon,
	layout as themeIcon,
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

	const sources = useMemo( () => {
		if ( records ) {
			const _sources = {
				theme: undefined,
				user: undefined,
				plugin: {},
			};

			for ( const template of records ) {
				const src = template.original_source;
				const obj = src === 'plugin' ? _sources.plugin : _sources;
				if ( ! obj[ src ] ) {
					obj[ src ] = {
						count: 0,
						value: template.author_text,
					};
				}
				obj[ src ].count++;
			}

			return _sources;
		}
	}, [ records ] );

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
			{ sources?.theme && (
				<DataViewItem
					slug="theme"
					title={ __( 'Theme' ) }
					icon={ themeIcon }
					isActive={ activeView === 'theme' }
					isCustom="false"
					suffix={ <span>{ sources.theme.count }</span> }
				/>
			) }
			{ sources?.user && (
				<DataViewItem
					slug="user"
					title={ __( 'Custom' ) }
					icon={ customIcon }
					isActive={ activeView === 'user' }
					isCustom="false"
					suffix={ <span>{ sources.user.count }</span> }
				/>
			) }
			{ sources?.plugin &&
				Object.entries( sources.plugin ).map(
					( [ key, { count, value } ] ) => (
						<DataViewItem
							key={ key }
							slug={ `plugin:${ value }` }
							title={ value }
							icon={ pluginIcon }
							isActive={ activeView === `plugin:${ value }` }
							isCustom="false"
							suffix={ <span>{ count }</span> }
						/>
					)
				) }
		</ItemGroup>
	);
}
