/**
 * WordPress dependencies
 */
import { useParams, useNavigate } from '@wordpress/route';
import { useEntityRecord } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Preview } from '@wordpress/lazy-editor';
import { Spinner } from '@wordpress/components';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import type { WpTemplatePart } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useMenuUsedInTemplateParts from './use-menu-used-in-template-parts';
import { unlock } from '../lock-unlock';

const { patternTitleField } = unlock( editorPrivateApis );

const NAVIGATION_POST_TYPE = 'wp_navigation';
const LAYOUT_GRID = 'grid';

const DEFAULT_VIEW = {
	type: LAYOUT_GRID as const,
	perPage: 20,
	titleField: 'title',
	mediaField: 'preview',
	fields: [],
};

const DEFAULT_LAYOUTS = {
	[ LAYOUT_GRID ]: {},
};

const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: ( { item }: { item: WpTemplatePart } ) => {
		return (
			<Preview
				content={ item?.content?.raw }
				blocks={ item?.blocks }
				description={ item.description }
			/>
		);
	},
	enableSorting: false,
};

function Canvas() {
	const { id } = useParams( { from: '/navigation/edit/$id' } );
	const navigate = useNavigate();
	const navigationId = parseInt( id );

	const [ view, setView ] = useState( DEFAULT_VIEW );

	const { record: navigationMenu, isResolving: isResolvingMenu } =
		useEntityRecord( 'postType', NAVIGATION_POST_TYPE, navigationId );

	const { templateParts, isResolving: isResolvingParts } =
		useMenuUsedInTemplateParts( navigationId );

	const fields = useMemo( () => [ previewField, patternTitleField ], [] );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( templateParts, view, fields ),
		[ templateParts, view, fields ]
	);

	const menuTitle = decodeEntities( navigationMenu?.title?.rendered ?? '' );

	if ( isResolvingMenu ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
					padding: '2rem',
				} }
			>
				<Spinner />
			</div>
		);
	}

	const title = menuTitle
		? sprintf(
				/* translators: %s: navigation menu name */
				__( 'Template parts using %s' ),
				menuTitle
		  )
		: __( 'Template parts' );

	return (
		<div
			style={ {
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				padding: '24px',
			} }
		>
			<h2 style={ { marginTop: 0, marginBottom: '24px' } }>{ title }</h2>
			{ ! isResolvingParts && templateParts.length === 0 ? (
				<div
					style={ {
						flex: 1,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#757575',
					} }
				>
					<p>
						{ sprintf(
							/* translators: %s: navigation menu name */
							__(
								'%s is not used in any template parts. Add a Navigation block to a header or footer template part to use this menu.'
							),
							menuTitle || __( 'This menu' )
						) }
					</p>
				</div>
			) : (
				<DataViews
					paginationInfo={ paginationInfo }
					fields={ fields }
					data={ data ?? [] }
					isLoading={ isResolvingParts }
					view={ view }
					onChangeView={ setView }
					defaultLayouts={ DEFAULT_LAYOUTS }
					onClickItem={ ( item: WpTemplatePart ) => {
						navigate( {
							to: `/types/wp_template_part/edit/${ encodeURIComponent(
								String( item.id )
							) }`,
						} );
					} }
				/>
			) }
		</div>
	);
}

// Export as both Canvas (for React component rules) and canvas (for route framework)
export { Canvas };
export { Canvas as canvas };
