import { useDispatch, useSelect } from '@wordpress/data';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { store as commandsStore } from '@wordpress/commands';
import { store as coreStore } from '@wordpress/core-data';
import { useNavigate } from '@wordpress/route';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import {
	layout,
	navigation,
	page,
	post,
	symbol,
	symbolFilled,
} from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Button,
	Icon,
	Text,
} from '@wordpress/ui';
import { store as bootStore } from '../../store';
import type { CanvasData } from '../../store/types';
import styles from './shell-document-bar.module.scss';

const POST_TYPE_ICONS: Record< string, typeof page > = {
	post,
	page,
	wp_template: layout,
	wp_template_part: symbolFilled,
	wp_block: symbol,
	wp_navigation: navigation,
};

type TitleField = string | { raw?: string; rendered?: string } | undefined;

function getTitle( title: TitleField ) {
	if ( typeof title === 'string' ) {
		return title;
	}
	return title?.raw || decodeEntities( title?.rendered ?? '' );
}

/**
 * Names what the shell shows, with the type as its icon, and offers the ways
 * to work with that document: viewing it on the site, or editing it. It sits
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
	const { open: openCommandPalette } = useDispatch( commandsStore );
	const { title, postType, typeLabel, link, editLink } = useSelect(
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
					typeLabel: getPostType( editorCanvas.postType )?.labels
						?.singular_name,
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
				typeLabel: getPostType( shownPostType )?.labels?.singular_name,
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
		<div className={ styles.document }>
			<div className={ styles[ 'document-bar' ] }>
				{ /* Like the editor's document bar, the title opens the command palette. */ }
				<Button
					variant="unstyled"
					className={ styles[ 'title-button' ] }
					aria-label={ sprintf(
						/* translators: 1: Post type label, e.g. "Page". 2: Title. */
						__( '%1$s: %2$s. Open command palette' ),
						typeLabel ?? '',
						displayTitle
					) }
					onClick={ () => openCommandPalette() }
				>
					<Icon
						className={ styles.icon }
						icon={ POST_TYPE_ICONS[ postType ] ?? page }
						size={ 20 }
					/>
					<Text variant="body-sm" className={ styles.title }>
						{ displayTitle }
					</Text>
				</Button>
			</div>
			{ /* Just outside the title box: related to what it names, but a choice of how to work with it. */ }
			<ToggleGroupControl
				className={ styles.modes }
				label={ __( 'Mode' ) }
				hideLabelFromVision
				value={ mode }
				onChange={ onChangeMode }
			>
				<ToggleGroupControlOption value="view" label={ __( 'View' ) } />
				<ToggleGroupControlOption
					value="edit"
					label={ __( 'Edit' ) }
					disabled={ ! editorCanvas && ! editLink }
				/>
			</ToggleGroupControl>
		</div>
	);
}
