import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { Collapsible, Icon, Link, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import { store as editorStore } from '../../store';
import { DESIGN_POST_TYPES, PATTERN_POST_TYPE } from '../../store/constants';

/**
 * Builds the admin URL that edits a given entry.
 *
 * @param {number} id   Post ID.
 * @param {string} type Post type.
 *
 * @return {string} URL of the editor for that entry.
 */
function getEditUrl( id, type ) {
	// Design post types are edited in the site editor, which routes on
	// `/<post type>/<post id>`.
	if ( DESIGN_POST_TYPES.includes( type ) ) {
		return addQueryArgs( 'site-editor.php', {
			p: `/${ type }/${ id }`,
			canvas: 'edit',
		} );
	}

	return addQueryArgs( 'post.php', { post: id, action: 'edit' } );
}

/**
 * Reshapes the endpoint payload into what the component renders, discarding
 * anything unexpected. Counts are derived from the entries themselves so the
 * summary can never disagree with the list below it.
 *
 * @param {Object} response Parsed response body.
 *
 * @return {Object} Normalized usage, as a total and a list of groups.
 */
function normalizeUsage( response ) {
	const groups = ( Array.isArray( response?.groups ) ? response.groups : [] )
		.map( ( group ) => ( {
			type: group?.type,
			name: group?.labels?.name || group?.type,
			singularName: group?.labels?.singular_name || group?.type,
			items: ( Array.isArray( group?.items ) ? group.items : [] )
				.filter( ( item ) => !! item?.id )
				.map( ( item ) => ( {
					id: item.id,
					title: typeof item.title === 'string' ? item.title : '',
				} ) ),
		} ) )
		.filter( ( group ) => !! group.type && group.items.length > 0 );

	return {
		total: groups.reduce( ( sum, group ) => sum + group.items.length, 0 ),
		groups,
	};
}

function usePatternUsage( patternId ) {
	const [ usage, setUsage ] = useState( null );

	useEffect( () => {
		if ( ! patternId ) {
			setUsage( null );
			return;
		}

		let isStale = false;

		apiFetch( { path: `/wp/v2/blocks/${ patternId }/usage` } ).then(
			( response ) => {
				if ( ! isStale ) {
					setUsage( normalizeUsage( response ) );
				}
			},
			() => {
				/*
				 * The route ships with the Gutenberg plugin, so it is absent on
				 * a plain WordPress install, and a user without access to the
				 * entries gets a permission error. Neither is worth an error
				 * message in a summary panel: the section is left out instead.
				 */
				if ( ! isStale ) {
					setUsage( null );
				}
			}
		);

		return () => {
			isStale = true;
		};
	}, [ patternId ] );

	return usage;
}

/**
 * Tells where a synced pattern is used, so that its reach is visible before it
 * is edited or deleted.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function PostPatternUsage() {
	const patternId = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		return getCurrentPostType() === PATTERN_POST_TYPE
			? getCurrentPostId()
			: null;
	}, [] );
	const usage = usePatternUsage( patternId );

	if ( ! usage ) {
		return null;
	}

	if ( usage.total === 0 ) {
		return (
			<div className="editor-post-pattern-usage">
				<Text>{ __( 'Not used anywhere.' ) }</Text>
			</div>
		);
	}

	const summary = sprintf(
		/* translators: %s: list of counts per post type, e.g. "5 Pages, 2 Templates". */
		__( 'Used in %s.' ),
		usage.groups
			.map( ( group ) =>
				sprintf(
					/* translators: 1: number of entries. 2: name of a post type, e.g. "Pages". */
					__( '%1$d %2$s' ),
					group.items.length,
					group.items.length === 1 ? group.singularName : group.name
				)
			)
			.join( ', ' )
	);

	return (
		<Collapsible.Root className="editor-post-pattern-usage">
			<Collapsible.Trigger className="editor-post-pattern-usage__trigger">
				<Text>{ summary }</Text>
				<Icon
					className="editor-post-pattern-usage__chevron"
					icon={ chevronDown }
					size={ 20 }
				/>
			</Collapsible.Trigger>
			<Collapsible.Panel>
				<Stack
					className="editor-post-pattern-usage__list"
					direction="column"
					gap="sm"
				>
					{ usage.groups.map( ( group ) => (
						<Stack key={ group.type } direction="column" gap="xs">
							<Text variant="body-sm">{ group.name }</Text>
							{ group.items.map( ( item ) => (
								<Link
									key={ item.id }
									href={ getEditUrl( item.id, group.type ) }
									openInNewTab
								>
									{ decodeEntities( item.title ) ||
										__( '(no title)' ) }
								</Link>
							) ) }
						</Stack>
					) ) }
				</Stack>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}
