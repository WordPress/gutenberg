import {
	BlockCanvas,
	BlockContextProvider,
	BlockEditorProvider,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import { useRegistry, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/ui';
import type { ReactNode } from 'react';
import { createBlock, parse } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { unlock } from '../../lock-unlock';

type HomePage = { postType: string; postId: string } | null | undefined;

const NOOP = () => {};
const THEME_KEY = '__theme';

function getRecordBlocks( record: any ): Block[] {
	if ( Array.isArray( record?.blocks ) ) {
		return record.blocks;
	}
	const content =
		typeof record?.content === 'string'
			? record.content
			: record?.content?.raw;
	return content
		? parse( content, { __unstableSkipMigrationLogs: true } )
		: [];
}

/**
 * Replaces each Template Part block with a Group holding its blocks, in the
 * same element (`header`, `footer` and so on).
 *
 * @param blocks  Blocks.
 * @param records Edited template part records, by ID.
 * @param theme   The current theme's stylesheet.
 * @return Blocks without Template Part blocks.
 */
function inlineTemplateParts(
	blocks: Block[],
	records: Record< string, any >,
	theme: string | undefined
): Block[] {
	return ( blocks ?? [] ).map( ( block ) => {
		if ( block.name !== 'core/template-part' ) {
			return {
				...block,
				innerBlocks: inlineTemplateParts(
					block.innerBlocks ?? [],
					records,
					theme
				),
			};
		}
		const { slug, tagName, className, align } = block.attributes;
		const record =
			records[ `${ block.attributes.theme || theme }//${ slug }` ];
		return createBlock(
			'core/group',
			{ tagName: tagName || 'div', className, align },
			inlineTemplateParts( getRecordBlocks( record ), records, theme )
		);
	} );
}

const FILL = {
	flex: 1,
	minHeight: 480,
	display: 'flex',
	flexDirection: 'column',
} as const;

/**
 * The page shown at the front of the site, and the template that renders it.
 *
 * @return `templateId` is null if there is none, undefined while it is being
 *         worked out.
 */
function useFrontOfSite(): {
	homePage: HomePage;
	templateId: string | null | undefined;
} {
	return useSelect( ( select ) => {
		const { getHomePage, getTemplateId } = unlock( select( coreStore ) );
		const homePage: HomePage = getHomePage();

		if ( ! homePage ) {
			return { homePage, templateId: undefined };
		}
		if ( homePage.postType === 'page' ) {
			return {
				homePage,
				templateId: getTemplateId( 'page', homePage.postId ),
			};
		}
		if ( homePage.postType === 'wp_template' ) {
			return { homePage, templateId: homePage.postId };
		}

		// Latest posts on the front: the home template, or else the index.
		const { getDefaultTemplateId } = select( coreStore );
		const homeId = getDefaultTemplateId( { slug: 'home' } );
		if ( homeId === undefined ) {
			return { homePage, templateId: undefined };
		}
		return {
			homePage,
			templateId:
				homeId || getDefaultTemplateId( { slug: 'index' } ) || null,
		};
	}, [] );
}

/**
 * Leaves only the site's saved menus editable: the rest of the page is disabled,
 * so it can't be selected, changed or added to. Clicking a menu selects it,
 * as in the editor.
 *
 * A disabled block's mode is inherited by the blocks inside it, unless they
 * have their own, so the top level is disabled and each menu is given its
 * own editable mode, including menus that load later (a header's blocks
 * arrive after the template's). It follows the block list through a store
 * subscription, set up once the canvas is in the page.
 *
 * @param props
 * @param props.children The canvas.
 */
function MenusOnly( { children }: { children: ReactNode } ) {
	const registry = useRegistry();
	const ref = useRefEffect< HTMLDivElement >( () => {
		const update = () => {
			const { getBlocksByName, getBlockEditingMode, getBlockAttributes } =
				registry.select( blockEditorStore );
			const { setBlockEditingMode } = registry.dispatch(
				blockEditorStore
			) as any;
			const changes: [ string, string ][] = [];
			if ( getBlockEditingMode( '' ) !== 'disabled' ) {
				changes.push( [ '', 'disabled' ] );
			}
			for ( const id of getBlocksByName( 'core/navigation' ) ) {
				// Only saved menus. A Navigation block with its links stored
				// in the page saves them as a new menu when they're edited,
				// and links it to that menu, which this read-only page can't
				// keep.
				if ( ! getBlockAttributes( id )?.ref ) {
					continue;
				}
				if ( getBlockEditingMode( id ) !== 'default' ) {
					changes.push( [ id, 'default' ] );
				}
			}
			if ( changes.length ) {
				registry.batch( () =>
					changes.forEach( ( [ id, mode ] ) =>
						setBlockEditingMode( id, mode )
					)
				);
			}
		};
		update();
		return registry.subscribe( update, blockEditorStore );
	}, [ registry ] );

	return (
		<div ref={ ref } style={ FILL }>
			{ children }
		</div>
	);
}

/**
 * The front of the site in the editor's canvas: its template, with the
 * site's real header, footer and menus, read from (and written to) the same
 * records as everywhere else. So a menu's unsaved changes show here as
 * they're made, and its items can be selected and edited in place, as in the
 * editor. Nothing else on the page can be changed.
 */
export default function MenuSitePreview() {
	const { homePage, templateId } = useFrontOfSite();
	const parentSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const isTemplateLoaded = useSelect(
		( select ) =>
			!! templateId &&
			!! select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_template',
				templateId
			),
		[ templateId ]
	);
	// Read only: blocks write small updates as they load (like a query's
	// ID), which would leave the template with unsaved changes. Menus save
	// to their own records, through the Navigation block.
	const [ templateBlocks ] = useEntityBlockEditor(
		'postType',
		'wp_template',
		{ id: templateId ?? undefined }
	);
	// The header, footer and other parts are inlined, rather than left to
	// the Template Part block to load: selecting a block inside one would
	// otherwise save it again (a theme's part as a customized copy). The
	// parts' unsaved changes are included.
	const partRecords = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getCurrentTheme } =
				select( coreStore );
			const theme = ( getCurrentTheme() as any )?.stylesheet;
			const records: Record< string, any > = {};
			const visit = ( blocks: Block[] | undefined ) => {
				for ( const block of blocks ?? [] ) {
					if ( block.name === 'core/template-part' ) {
						const id = `${ block.attributes.theme || theme }//${
							block.attributes.slug
						}`;
						if ( ! ( id in records ) ) {
							const record = getEditedEntityRecord(
								'postType',
								'wp_template_part',
								id
							);
							records[ id ] = record ?? null;
							if ( record ) {
								visit( getRecordBlocks( record ) );
							}
						}
					}
					visit( block.innerBlocks ?? [] );
				}
			};
			if ( theme ) {
				visit( ( templateBlocks ?? [] ) as Block[] );
			}
			// Flat, so the result compares equal while nothing changes.
			return { ...records, [ THEME_KEY ]: theme };
		},
		[ templateBlocks ]
	);
	const blocks = useMemo(
		() =>
			inlineTemplateParts(
				( templateBlocks ?? [] ) as Block[],
				partRecords,
				partRecords[ THEME_KEY ]
			),
		[ templateBlocks, partRecords ]
	);
	// The surrounding provider may be set up for previews only.
	const settings = useMemo(
		() => ( { ...parentSettings, isPreviewMode: false } ),
		[ parentSettings ]
	);
	// A static front page's template shows its content.
	const context = useMemo(
		() =>
			homePage?.postType === 'page'
				? { postType: 'page', postId: homePage.postId }
				: {},
		[ homePage ]
	);

	if ( templateId === null ) {
		return <p>{ __( 'There’s no preview of your site to show.' ) }</p>;
	}
	if ( ! isTemplateLoaded ) {
		return (
			<div
				style={ {
					...FILL,
					alignItems: 'center',
					justifyContent: 'center',
				} }
			>
				<Spinner />
			</div>
		);
	}

	return (
		<div
			className="menu-locations__site-preview"
			style={ {
				...FILL,
				borderRadius: 2,
				overflow: 'hidden',
				outline:
					'1px solid var(--wpds-color-stroke-surface-neutral, #ddd)',
			} }
		>
			<BlockEditorProvider
				value={ blocks }
				onInput={ NOOP }
				onChange={ NOOP }
				settings={ settings }
			>
				<BlockContextProvider value={ context }>
					<MenusOnly>
						<BlockCanvas
							height="100%"
							styles={ ( settings as any ).styles }
						/>
					</MenusOnly>
				</BlockContextProvider>
			</BlockEditorProvider>
		</div>
	);
}
