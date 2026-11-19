import {
	BlockCanvas,
	BlockContextProvider,
	BlockEditorProvider,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Button,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import { useRegistry, useSelect } from '@wordpress/data';
import { useInstanceId, useRefEffect } from '@wordpress/compose';
import {
	createInterpolateElement,
	useMemo,
	useState,
} from '@wordpress/element';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { __, sprintf } from '@wordpress/i18n';
import { desktop, tablet, mobile } from '@wordpress/icons';
import {
	Link,
	// eslint-disable-next-line @wordpress/use-recommended-components
	Menu,
	Notice,
	Select,
	Spinner,
	Stack,
	Text,
	Tooltip,
} from '@wordpress/ui';
import type { ReactNode } from 'react';
import { createBlock, parse } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { unlock } from '../../lock-unlock';
import {
	getShownMenuId,
	getTemplatePartBlocks,
	getTemplatePartTitle,
	showsMenu,
} from './utils';
import type { MenuLocationBlock, NavigationLocation } from './utils';

const { getViewportBreakpoints, getViewportBreakpointValueInPixels } = unlock(
	globalStylesEnginePrivateApis
);

type HomePage = { postType: string; postId: string } | null | undefined;
type TemplateRecord = Record< string, any >;
type DeviceType = 'Desktop' | 'Tablet' | 'Mobile';

const NOOP = () => {};
const THEME_KEY = '__theme';
const EMPTY_ARRAY: never[] = [];
const TEMPLATES_QUERY = { per_page: -1 };
const PAGES_QUERY = { per_page: 50, status: 'publish' };
const POSTS_QUERY = { per_page: 1, status: 'publish' };
const WEAK_COLOR = 'var(--wpds-color-foreground-content-neutral-weak, #757575)';

const DEVICES: Record< DeviceType, { label: string; icon: any } > = {
	Desktop: { label: __( 'Desktop' ), icon: desktop },
	Tablet: { label: __( 'Tablet' ), icon: tablet },
	Mobile: { label: __( 'Mobile' ), icon: mobile },
};

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

/**
 * Whether a template shows a menu, in its own blocks or in one of its parts.
 *
 * @param blocks         The template's blocks.
 * @param menuId         The menu's ID.
 * @param fallbackMenuId The menu shown when no menu is chosen.
 * @param partIds        Template parts that show the menu.
 * @param theme          The current theme's stylesheet.
 * @return Whether it shows the menu.
 */
function templateShowsMenu(
	blocks: MenuLocationBlock[],
	menuId: number,
	fallbackMenuId: number | null,
	partIds: Set< string >,
	theme: string | undefined
): boolean {
	return blocks.some( ( block ) => {
		if ( block.name === 'core/navigation' ) {
			return showsMenu( block, menuId, fallbackMenuId );
		}
		if ( block.name === 'core/template-part' ) {
			return partIds.has(
				`${ block.attributes.theme || theme }//${
					block.attributes.slug
				}`
			);
		}
		return templateShowsMenu(
			block.innerBlocks ?? [],
			menuId,
			fallbackMenuId,
			partIds,
			theme
		);
	} );
}

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
 * The templates that show a menu, with unsaved edits: the front of the site's
 * first, so a menu in the header opens on the homepage, then by title.
 *
 * @param navigationId    The menu's ID.
 * @param fallbackMenuId  The menu shown when no menu is chosen.
 * @param locations       The template parts that show the menu.
 * @param frontTemplateId The front of the site's template.
 * @return The templates, or null while they load.
 */
function useMenuTemplates(
	navigationId: number,
	fallbackMenuId: number | null,
	locations: NavigationLocation[],
	frontTemplateId: string | null | undefined
): TemplateRecord[] | null {
	const { templates, theme } = useSelect( ( select ) => {
		const { getEntityRecords, getEditedEntityRecord, getCurrentTheme } =
			select( coreStore );
		const records = getEntityRecords< TemplateRecord >(
			'postType',
			'wp_template',
			TEMPLATES_QUERY
		);
		return {
			templates: records
				? ( records.map( ( record ) =>
						getEditedEntityRecord(
							'postType',
							'wp_template',
							record.id
						)
					) as TemplateRecord[] )
				: null,
			theme: ( getCurrentTheme() as any )?.stylesheet as
				string | undefined,
		};
	}, [] );

	return useMemo( () => {
		if ( ! templates ) {
			return null;
		}
		const partIds = new Set( locations.map( ( location ) => location.id ) );
		return templates
			.filter( ( template ) =>
				templateShowsMenu(
					getTemplatePartBlocks( template ),
					navigationId,
					fallbackMenuId,
					partIds,
					theme
				)
			)
			.sort(
				( a, b ) =>
					Number( b.id === frontTemplateId ) -
						Number( a.id === frontTemplateId ) ||
					getTemplatePartTitle( a ).localeCompare(
						getTemplatePartTitle( b )
					)
			);
	}, [
		templates,
		theme,
		locations,
		navigationId,
		fallbackMenuId,
		frontTemplateId,
	] );
}

/**
 * Something a template shows, to fill it in the preview: the homepage for the
 * front of the site's template, a page for a page template, the latest post
 * for a post template. Other templates, like archives, show without one.
 *
 * @param templateId      The template's ID.
 * @param template        The template, if it shows the menu.
 * @param homePage        The page shown at the front of the site.
 * @param frontTemplateId The front of the site's template.
 * @return `{ postType, postId, title, isHomepage }`, each undefined when
 *         there's nothing.
 */
function useTemplateExample(
	templateId: string | null | undefined,
	template: TemplateRecord | undefined,
	homePage: HomePage,
	frontTemplateId: string | null | undefined
): {
	postType?: string;
	postId?: string | number;
	title?: string;
	isHomepage?: boolean;
} {
	return useSelect(
		( select ) => {
			if ( templateId && templateId === frontTemplateId ) {
				return homePage?.postType === 'page'
					? {
							postType: 'page',
							postId: homePage.postId,
							isHomepage: true,
						}
					: { isHomepage: true };
			}

			if ( ! template ) {
				return {};
			}
			const { getEntityRecords } = select( coreStore );
			const slug: string = template.slug ?? '';
			const toExample = ( postType: string, record: any ) =>
				record
					? {
							postType,
							postId: record.id,
							title: getTemplatePartTitle( record ),
						}
					: {};

			if ( template.is_custom ) {
				for ( const postType of [ 'page', 'post' ] ) {
					const record = getEntityRecords< any >(
						'postType',
						postType,
						PAGES_QUERY
					)?.find( ( item ) => item.template === slug );
					if ( record ) {
						return toExample( postType, record );
					}
				}
				return {};
			}
			if ( slug === 'page' || slug.startsWith( 'page-' ) ) {
				const pageSlug = slug.slice( 'page-'.length );
				const pages =
					getEntityRecords< any >(
						'postType',
						'page',
						PAGES_QUERY
					) ?? EMPTY_ARRAY;
				const page =
					slug === 'page'
						? ( pages.find(
								( item: any ) =>
									! item.template &&
									String( item.id ) !== homePage?.postId
							) ??
							pages.find( ( item: any ) => ! item.template ) )
						: pages.find(
								( item: any ) =>
									item.slug === pageSlug ||
									String( item.id ) === pageSlug
							);
				return toExample( 'page', page );
			}
			if ( slug === 'single' || slug === 'single-post' ) {
				return toExample(
					'post',
					getEntityRecords< any >(
						'postType',
						'post',
						POSTS_QUERY
					)?.[ 0 ]
				);
			}
			return {};
		},
		[ templateId, template, homePage, frontTemplateId ]
	);
}

/**
 * The width of each device, from the theme's breakpoints, as in the editor.
 *
 * @param deviceType The device.
 * @return The width in pixels, or undefined for the full width.
 */
function useDeviceWidth( deviceType: DeviceType ): number | undefined {
	const viewport = useSelect(
		( select ) =>
			( select( blockEditorStore ).getSettings() as any )
				.__experimentalFeatures?.viewport,
		[]
	);
	if ( deviceType === 'Desktop' ) {
		return undefined;
	}
	const breakpoints = getViewportBreakpoints( viewport );
	const width = getViewportBreakpointValueInPixels(
		breakpoints[ deviceType === 'Tablet' ? 'tablet' : 'mobile' ]
	);
	return width ? width - 1 : undefined;
}

/**
 * Leaves only the menu editable, and shows where it is: the rest of the page
 * is disabled, so it can't be selected, changed or added to, other menus are
 * faded, and the page scrolls to the menu if it's out of sight.
 *
 * A disabled block's mode is inherited by the blocks inside it, unless they
 * have their own, so the top level is disabled and the menu is given its own
 * editable mode, including when it loads later. It follows the block list
 * through a store subscription, set up once the canvas is in the page.
 *
 * @param props
 * @param props.navigationId   The menu's ID.
 * @param props.fallbackMenuId The menu shown when no menu is chosen.
 * @param props.width          The canvas width, or undefined for the full width.
 * @param props.styles         The editor's styles.
 */
function MenuFocus( {
	navigationId,
	fallbackMenuId,
	width,
	styles,
}: {
	navigationId: number;
	fallbackMenuId: number | null;
	width: number | undefined;
	styles: any[] | undefined;
} ) {
	const registry = useRegistry();
	const [ css, setCss ] = useState( '' );
	const canvasStyles = useMemo(
		() => [ ...( styles ?? EMPTY_ARRAY ), { css } ],
		[ styles, css ]
	);
	const ref = useRefEffect< HTMLDivElement >(
		( node ) => {
			let scrolled = false;
			let timeout: ReturnType< typeof setTimeout > | undefined;
			let previousCss = '';

			const scrollTo = ( clientId: string, attempt = 0 ) => {
				const doc = node.querySelector( 'iframe' )?.contentDocument;
				const element = doc?.querySelector(
					`[data-block="${ clientId }"]`
				);
				if ( ! doc || ! element ) {
					if ( attempt < 30 ) {
						timeout = setTimeout(
							() => scrollTo( clientId, attempt + 1 ),
							100
						);
					}
					return;
				}
				const rect = element.getBoundingClientRect();
				const height = doc.defaultView?.innerHeight ?? 0;
				if ( rect.top < 0 || rect.bottom > height ) {
					element.scrollIntoView( { block: 'center' } );
				}
			};

			const update = () => {
				const {
					getBlocksByName,
					getBlockEditingMode,
					getBlockAttributes,
					getBlockOrder,
				} = registry.select( blockEditorStore );
				const { setBlockEditingMode } = registry.dispatch(
					blockEditorStore
				) as any;
				const changes: [ string, string ][] = [];
				const shown: string[] = [];
				const others: string[] = [];
				if ( getBlockEditingMode( '' ) !== 'disabled' ) {
					changes.push( [ '', 'disabled' ] );
				}
				for ( const id of getBlocksByName( 'core/navigation' ) ) {
					const attributes = getBlockAttributes( id ) ?? {};
					const isShown =
						getShownMenuId(
							{
								attributes,
								innerBlocks: getBlockOrder( id ),
							} as unknown as MenuLocationBlock,
							fallbackMenuId
						) === navigationId;
					( isShown ? shown : others ).push( id );
					// Only a saved menu. A Navigation block with its links
					// stored in the page saves them as a new menu when
					// they're edited, which this read-only page can't keep.
					if (
						isShown &&
						attributes.ref &&
						getBlockEditingMode( id ) !== 'default'
					) {
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

				const nextCss = [
					...others.map(
						( id ) =>
							`[data-block="${ id }"] { opacity: 0.3; transition: opacity 0.2s; }`
					),
					...shown.map(
						( id ) =>
							`[data-block="${ id }"]:not(.is-selected):not(.has-child-selected) { outline: 2px dashed var(--wp-admin-theme-color, #3858e9); outline-offset: 6px; }`
					),
				].join( '\n' );
				if ( nextCss !== previousCss ) {
					previousCss = nextCss;
					setCss( nextCss );
				}
				if ( ! scrolled && shown.length ) {
					scrolled = true;
					scrollTo( shown[ 0 ] );
				}
			};
			update();
			const unsubscribe = registry.subscribe( update, blockEditorStore );
			return () => {
				unsubscribe();
				clearTimeout( timeout );
			};
		},
		[ registry, navigationId, fallbackMenuId ]
	);

	return (
		<div
			ref={ ref }
			style={ {
				flex: 1,
				minHeight: 480,
				display: 'flex',
				flexDirection: 'column',
				width: width ?? '100%',
				maxWidth: '100%',
				alignSelf: 'center',
				transition: 'width 0.2s',
			} }
		>
			<BlockCanvas height="100%" styles={ canvasStyles } />
		</div>
	);
}

function DeviceMenu( {
	value,
	onChange,
}: {
	value: DeviceType;
	onChange: ( value: DeviceType ) => void;
} ) {
	return (
		<Menu.Root modal={ false }>
			<Menu.Trigger
				render={
					<Button
						size="compact"
						icon={ DEVICES[ value ].icon }
						label={ __( 'View' ) }
					/>
				}
			/>
			<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
				<Menu.RadioGroup
					value={ value }
					onValueChange={ ( next: string ) =>
						onChange( next as DeviceType )
					}
				>
					{ ( Object.keys( DEVICES ) as DeviceType[] ).map(
						( device ) => (
							<Menu.RadioItem key={ device } value={ device }>
								<Menu.ItemLabel>
									{ DEVICES[ device ].label }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						)
					) }
				</Menu.RadioGroup>
			</Menu.Popup>
		</Menu.Root>
	);
}

/**
 * "Template parts", with a dashed underline and a tooltip saying what one is.
 * Tooltips aren't read out, so the explanation is also the term's
 * description for screen readers.
 *
 * @param props
 * @param props.children The term.
 */
function TemplatePartsTerm( { children }: { children?: ReactNode } ) {
	const id = useInstanceId( TemplatePartsTerm, 'template-parts-term' );
	const explanation = __(
		'A template part is an area shared by many pages of your site, like a header or footer. Change it once, and it changes everywhere it’s used.'
	);
	return (
		<>
			<Tooltip.Root>
				<Tooltip.Trigger
					render={
						<span
							// Focusable, so the tooltip opens from the keyboard.
							tabIndex={ 0 }
							aria-describedby={ id }
							style={ {
								textDecoration: 'underline dashed',
								textUnderlineOffset: 3,
								cursor: 'help',
							} }
						/>
					}
				>
					{ children }
				</Tooltip.Trigger>
				<Tooltip.Popup>{ explanation }</Tooltip.Popup>
			</Tooltip.Root>
			{ /* Hidden, but still read as the term's description. */ }
			<span id={ id } hidden>
				{ explanation }
			</span>
		</>
	);
}

/**
 * The site in the editor's canvas, on a page that shows the menu: the
 * homepage if it does, otherwise another template's, filled with a page or
 * post that uses it. When the menu shows on more than one template, they can
 * be switched between. The site's real header, footer and menus are read
 * from the same records as everywhere else, so the menu's unsaved changes
 * show as they're made, and its items can be selected and edited in place.
 * Nothing else on the page can be changed.
 *
 * @param props
 * @param props.navigationId     The menu's ID.
 * @param props.fallbackMenuId   The menu shown when no menu is chosen.
 * @param props.locations        The template parts that show the menu.
 * @param props.onChooseLocation Opens the choice of where the menu appears.
 */
export default function MenuSitePreview( {
	navigationId,
	fallbackMenuId,
	locations,
	onChooseLocation,
}: {
	navigationId: number;
	fallbackMenuId: number | null;
	locations: NavigationLocation[];
	onChooseLocation?: () => void;
} ) {
	const { homePage, templateId: frontTemplateId } = useFrontOfSite();
	const templates = useMenuTemplates(
		navigationId,
		fallbackMenuId,
		locations,
		frontTemplateId
	);
	const [ selectedId, setSelectedId ] = useState< string >();
	const [ deviceType, setDeviceType ] = useState< DeviceType >( 'Desktop' );
	const deviceWidth = useDeviceWidth( deviceType );
	const template =
		templates?.find( ( item ) => item.id === selectedId ) ??
		templates?.[ 0 ];
	// A menu shown nowhere previews on the front of the site.
	const templateId: string | null | undefined =
		templates === null ? undefined : ( template?.id ?? frontTemplateId );
	const example = useTemplateExample(
		templateId,
		template,
		homePage,
		frontTemplateId
	);

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
	const { postType, postId } = example;
	const context = useMemo(
		() => ( postType && postId ? { postType, postId } : {} ),
		[ postType, postId ]
	);

	const templateItems = ( templates ?? EMPTY_ARRAY ).map(
		( item: TemplateRecord ) => ( {
			value: item.id as string,
			label: getTemplatePartTitle( item ),
		} )
	);

	if ( templateId === null ) {
		return <p>{ __( 'There’s no preview of your site to show.' ) }</p>;
	}

	const notice = !! templates &&
		! templates.length &&
		!! locations.length && (
			<Notice.Root intent="warning">
				<Notice.Description>
					{ createInterpolateElement(
						onChooseLocation
							? __(
									'This menu is only in <term>template parts</term> that your site doesn’t use, so it doesn’t appear in the preview. <link>Choose where it appears</link>.'
								)
							: __(
									'This menu is only in <term>template parts</term> that your site doesn’t use, so it doesn’t appear in the preview.'
								),
						{
							term: <TemplatePartsTerm />,
							link: (
								<Link
									tone="neutral"
									// A button, as it opens a dialog.
									render={
										<button
											type="button"
											onClick={ onChooseLocation }
											style={ {
												background: 'none',
												border: 0,
												padding: 0,
												font: 'inherit',
												cursor: 'pointer',
												textDecoration: 'underline',
											} }
										/>
									}
								/>
							),
						}
					) }
				</Notice.Description>
			</Notice.Root>
		);

	const toolbar = (
		<Stack direction="row" align="center" justify="space-between" gap="md">
			<Stack direction="row" align="center" gap="md">
				{ templates && templates.length > 1 && (
					<Stack direction="row" align="center" gap="sm">
						<Text variant="body-sm" style={ { color: WEAK_COLOR } }>
							{ __( 'Shown on' ) }
						</Text>
						<Select.Root
							items={ templateItems }
							value={ template?.id }
							onValueChange={ ( value ) =>
								setSelectedId( value as string )
							}
						>
							<Select.Trigger
								size="compact"
								aria-label={ __( 'Shown on' ) }
							/>
							<Select.Popup>
								{ templateItems.map( ( item ) => (
									<Select.Item
										key={ item.value }
										value={ item.value }
									>
										<Select.ItemLabel>
											{ item.label }
										</Select.ItemLabel>
									</Select.Item>
								) ) }
							</Select.Popup>
						</Select.Root>
					</Stack>
				) }
				{ ( example.isHomepage || example.title ) && (
					<Text variant="body-sm" style={ { color: WEAK_COLOR } }>
						<Truncate>
							{ example.isHomepage
								? __( 'Showing your homepage' )
								: sprintf(
										/* translators: %s: Title of the page shown in the preview. */
										__( 'Showing “%s”' ),
										example.title ?? ''
									) }
						</Truncate>
					</Text>
				) }
			</Stack>
			<DeviceMenu value={ deviceType } onChange={ setDeviceType } />
		</Stack>
	);

	if ( ! isTemplateLoaded ) {
		return (
			<>
				{ notice }
				{ toolbar }
				<div
					style={ {
						flex: 1,
						minHeight: 480,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					} }
				>
					<Spinner />
				</div>
			</>
		);
	}

	return (
		<>
			{ notice }
			{ toolbar }
			<div
				className="menu-locations__site-preview"
				style={ {
					flex: 1,
					minHeight: 480,
					display: 'flex',
					flexDirection: 'column',
					borderRadius: 2,
					overflow: 'hidden',
					outline:
						'1px solid var(--wpds-color-stroke-surface-neutral, #ddd)',
					background:
						'var(--wpds-color-background-surface-neutral-weak, #f0f0f0)',
				} }
			>
				<BlockEditorProvider
					key={ templateId }
					value={ blocks }
					onInput={ NOOP }
					onChange={ NOOP }
					settings={ settings }
				>
					<BlockContextProvider value={ context }>
						<MenuFocus
							navigationId={ navigationId }
							fallbackMenuId={ fallbackMenuId }
							width={ deviceWidth }
							styles={ ( settings as any ).styles }
						/>
					</BlockContextProvider>
				</BlockEditorProvider>
			</div>
		</>
	);
}
