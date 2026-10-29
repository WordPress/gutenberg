import { useSelect } from '@wordpress/data';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { globe, pencil } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useNavigate } from '@wordpress/route';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import type { ReactNode } from 'react';
import { store as bootStore } from '../../store';
import type { CanvasData, RouteBreadcrumb } from '../../store/types';
import { ShellPageActionsSlot } from './shell-page-actions';
import styles from './shell-document-bar.module.scss';

// The admin screens that manage each type, which the trail leads back to.
const PARENT_SCREENS: Record< string, string > = {
	post: '/posts',
	page: '/pages',
	wp_template: '/templates',
	wp_template_part: '/template-parts',
	wp_block: '/patterns',
	wp_navigation: '/navigation',
};

type TitleField = string | { raw?: string; rendered?: string } | undefined;

function getTitle( title: TitleField ) {
	if ( typeof title === 'string' ) {
		return title;
	}
	return title?.raw || decodeEntities( title?.rendered ?? '' );
}

/**
 * The box naming where the shell is, the same in every mode: the site's
 * icon at its start, carrying the site's brand wherever the shell goes, the
 * trail in its middle, and what to do there at its end.
 *
 * @param props          Component props.
 * @param props.items    The trail to where the shell is, ending there.
 * @param props.children What to do there, such as switching modes.
 * @return The title box.
 */
function ShellTitle( {
	items,
	children,
}: {
	items: RouteBreadcrumb[];
	children?: ReactNode;
} ) {
	const iconUrl = useSelect(
		( select ) =>
			(
				select( coreStore ).getEntityRecord(
					'root',
					'__unstableBase'
				) as { site_icon_url?: string } | undefined
			 )?.site_icon_url,
		[]
	);

	return (
		<div className={ styles.document }>
			<div className={ styles.start }>
				{ iconUrl && (
					<img className={ styles.icon } src={ iconUrl } alt="" />
				) }
			</div>
			<Breadcrumbs items={ items } />
			<div className={ styles.end }>{ children }</div>
		</div>
	);
}

/**
 * Names the admin screen the shell shows, in the same place as the document
 * it shows elsewhere, with the screen's own actions in it. A screen with more
 * than one action shows its main one, and the rest in a menu after it.
 *
 * @param props       Component props.
 * @param props.items The trail to the screen, ending with it.
 * @return The page bar.
 */
export function ShellPageBar( { items }: { items: RouteBreadcrumb[] } ) {
	return (
		<ShellTitle items={ items }>
			<ShellPageActionsSlot
				bubblesVirtually
				className={ styles.actions }
			/>
		</ShellTitle>
	);
}

/**
 * Names what the shell shows, after the screen that manages its type, and
 * offers the ways to work with that document: viewing it on the site, or editing it. It sits
 * in the same place in each, so it carries over between them.
 *
 * @param props              Component props.
 * @param props.editorCanvas The entity being edited, or none on the site.
 * @return The document bar, once there is something to name.
 */
export default function ShellDocumentBar( {
	editorCanvas,
}: {
	editorCanvas?: CanvasData;
} ) {
	const navigate = useNavigate();
	const { title, postType, parentLabel, link, editLink } = useSelect(
		( select ) => {
			const { getEntityLink, getShownEntity } = select( bootStore );
			const { getEditedEntityRecord, getPostType } = select( coreStore );

			// In the editor, the entity being edited, live, so renaming
			// it renames it here too.
			if ( editorCanvas ) {
				const record = getEditedEntityRecord(
					'postType',
					editorCanvas.postType,
					editorCanvas.postId
				) as { title?: TitleField; link?: string } | undefined;
				return {
					title: getTitle( record?.title ),
					postType: editorCanvas.postType,
					parentLabel: getPostType( editorCanvas.postType )?.labels
						?.name,
					link: record?.link,
					editLink: undefined,
				};
			}

			// On the site, its content when it has some, otherwise the
			// template that renders it.
			const shown = getShownEntity();
			if ( ! shown ) {
				return {};
			}
			const hasContent = !! ( shown.postType && shown.postId );
			const shownPostType = hasContent ? shown.postType : 'wp_template';
			return {
				title: hasContent ? shown.postTitle : shown.templateTitle,
				postType: shownPostType,
				parentLabel: getPostType( shownPostType )?.labels?.name,
				link: undefined,
				editLink: hasContent
					? getEntityLink( shown.postType, shown.postId )
					: getEntityLink( 'wp_template', shown.templateId ),
			};
		},
		[ editorCanvas ]
	);

	const siteUrl = useSelect(
		( select ) =>
			(
				select( coreStore ).getEntityRecord(
					'root',
					'__unstableBase'
				) as { home?: string } | undefined
			 )?.home,
		[]
	);

	if ( ! postType ) {
		return null;
	}

	const displayTitle = title || __( '(no title)' );
	const parentScreen = PARENT_SCREENS[ postType ];

	// Viewing returns to the site at the entity's own page. Entities without
	// one, such as templates, return to where the site was left.
	const onView = () => {
		if ( link && siteUrl && link.startsWith( siteUrl ) ) {
			const url = new URL( link );
			navigate( {
				to: '/',
				search: { preview: `${ url.pathname }${ url.search }` },
			} );
			return;
		}
		navigate( { to: '/' } );
	};

	// Styling the site is part of viewing it, so it is View here too.
	const mode = editorCanvas ? 'edit' : 'view';

	const onChangeMode = ( nextMode: string | number | undefined ) => {
		if ( nextMode === mode ) {
			return;
		}
		if ( nextMode === 'view' ) {
			onView();
		} else if ( nextMode === 'edit' && editLink ) {
			navigate( { to: editLink } );
		}
	};

	return (
		<ShellTitle
			items={ [
				...( parentScreen && parentLabel
					? [ { label: parentLabel, to: parentScreen } ]
					: [] ),
				{ label: displayTitle },
			] }
		>
			<ToggleGroupControl
				className={ styles.modes }
				label={ __( 'Mode' ) }
				hideLabelFromVision
				value={ mode }
				onChange={ onChangeMode }
			>
				{ /* Icons, so the title has the room. Their names show on hover and focus. */ }
				<ToggleGroupControlOptionIcon
					value="view"
					icon={ globe }
					label={ __( 'View' ) }
				/>
				<ToggleGroupControlOptionIcon
					value="edit"
					icon={ pencil }
					label={ __( 'Edit' ) }
					disabled={ ! editorCanvas && ! editLink }
				/>
			</ToggleGroupControl>
		</ShellTitle>
	);
}
