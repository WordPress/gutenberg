import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import InspectorControls from '../components/inspector-controls';
import { useBlockEditingMode } from '../components/block-editing-mode';
import {
	getElementLayers,
	getHeadingLevel,
	useResolvedStyle,
} from '../components/global-styles/inherited-value-context';
import { isGlobalStylesInheritanceIndicatorUIEnabled } from '../components/global-styles/inheritance';
import { getVariationNameFromClass } from './block-style-variation';
import {
	getCSSNotes,
	getOriginPhrase,
	getStyleSettings,
	getStylesLayer,
	isFromUserStyles,
	isSetOnBlock,
} from './style-origins';
import type {
	BlockAttributes,
	Names,
	Origin,
	SourceMap,
	StyleSetting,
} from './style-origins';
import { store as blockEditorStore } from '../store';
import {
	globalStylesDataKey,
	globalStylesUserDataKey,
} from '../store/private-keys';
import { unlock } from '../lock-unlock';

const { resolveStyle } = unlock( globalStylesEnginePrivateApis );

interface Row {
	setting: StyleSetting;
	origin?: Origin;
	notes: string[];
}

interface StyleOverridesPanelProps {
	name: string;
	clientId: string;
}

function getTitle( blockName: string ): string {
	return getBlockType( blockName )?.title ?? blockName;
}

function StyleList( {
	title,
	rows,
	describe,
	children,
}: {
	title: string;
	rows: Row[];
	describe: ( row: Row ) => string | null;
	children?: React.ReactNode;
} ) {
	const instanceId = useInstanceId( StyleList );
	const headingId = `block-editor-style-overrides__title-${ instanceId }`;
	return (
		<div className="block-editor-style-overrides">
			<h3
				id={ headingId }
				className="block-editor-style-overrides__title"
			>
				{ title }
			</h3>
			{ !! rows.length && (
				<ul aria-labelledby={ headingId }>
					{ rows.map( ( row ) => {
						const description = describe( row );
						return (
							<li
								key={ row.setting.label }
								className="block-editor-style-overrides__item"
							>
								<span className="block-editor-style-overrides__label">
									{ row.setting.label }
								</span>
								{ description && (
									<span className="block-editor-style-overrides__origin">
										{ description }
									</span>
								) }
								{ row.notes.map( ( note ) => (
									<span
										key={ note }
										className="block-editor-style-overrides__origin"
									>
										{ note }
									</span>
								) ) }
							</li>
						);
					} ) }
				</ul>
			) }
			{ children }
		</div>
	);
}

/**
 * Whether an inherited row only repeats the theme's own styles, with no
 * parent block, Styles change or custom CSS involved. These rows apply to
 * almost every block, so they are hidden until asked for.
 *
 * @param row Inherited row.
 * @return Whether the value comes only from the theme.
 */
function isThemeOnly( row: Row ): boolean {
	const { origin, notes } = row;
	return origin?.type === 'styles' && ! origin.fromUser && ! notes.length;
}

/*
 * The lists. Rendered inside the Advanced panel, which only mounts its
 * contents while it is open, so none of this runs until someone opens it.
 */
function StyleOrigins( { name, clientId }: StyleOverridesPanelProps ) {
	const [ showThemeRows, setShowThemeRows ] = useState( false );
	const {
		attributes,
		variationName,
		variationLabel,
		elements,
		parentIds,
		mergedStyles,
		userStyles,
	} = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockParents, getSettings } =
				select( blockEditorStore );
			const blockAttributes: BlockAttributes | undefined =
				getBlockAttributes( clientId );
			const styles: { name: string; label?: string }[] =
				select( blocksStore ).getBlockStyles( name ) ?? [];
			const variation = getVariationNameFromClass(
				blockAttributes?.className,
				styles
			);
			const settings = getSettings() as Record< symbol, any >;
			return {
				attributes: blockAttributes,
				variationName: variation,
				variationLabel: styles.find(
					( style ) => style.name === variation
				)?.label,
				elements: getElementLayers(
					name,
					getHeadingLevel( name, blockAttributes?.level )
				) as string[],
				// The block's parents, nearest first.
				parentIds: getBlockParents( clientId, true ) as string[],
				mergedStyles: settings[ globalStylesDataKey ],
				userStyles: settings[ globalStylesUserDataKey ],
			};
		},
		[ name, clientId ]
	);
	// Arrays of stable references, so these only change with the parents.
	const parentNames: string[] = useSelect(
		( select ) =>
			parentIds.map( ( parentId ) =>
				select( blockEditorStore ).getBlockName( parentId )
			),
		[ parentIds ]
	);
	const parentAttributes: BlockAttributes[] = useSelect(
		( select ) =>
			parentIds.map( ( parentId ) =>
				select( blockEditorStore ).getBlockAttributes( parentId )
			),
		[ parentIds ]
	);
	const { sources } = useResolvedStyle( name, attributes?.className ) as {
		sources: SourceMap;
	};

	// What Styles set for each parent's block type, to trace values that
	// pass down from a parent.
	const parentSources: SourceMap[] = useMemo(
		() =>
			parentNames.map(
				( parentName ) =>
					resolveStyle(
						{ styles: mergedStyles ?? {} },
						{ blockName: parentName }
					).sources
			),
		[ parentNames, mergedStyles ]
	);

	const blockTitle = getTitle( name );
	const names: Names = {
		blockTitle,
		variationLabel,
		element: elements[ elements.length - 1 ],
		getTitle,
	};

	const { ownRows, inheritedRows } = useMemo( () => {
		/*
		 * Where the value comes from, apart from the block's own setting. Styles
		 * that target the block (its element, block type or block style) win.
		 * Otherwise, for a property that passes down, the nearest parent that
		 * sets it wins over the site-wide styles, which reach the block the same
		 * way.
		 */
		const getOrigin = ( setting: StyleSetting ): Origin | undefined => {
			const layer = getStylesLayer( sources, setting.paths );
			const stylesOrigin = ( stylesLayer: string ): Origin => ( {
				type: 'styles',
				layer: stylesLayer,
				fromUser: isFromUserStyles(
					userStyles,
					stylesLayer,
					setting.paths,
					name,
					variationName,
					elements
				),
			} );
			if ( layer && layer !== 'root' ) {
				return stylesOrigin( layer );
			}
			if ( setting.inherits ) {
				for ( let i = 0; i < parentNames.length; i++ ) {
					if ( isSetOnBlock( parentAttributes[ i ], setting ) ) {
						return {
							type: 'parent',
							parentName: parentNames[ i ],
							via: 'block',
						};
					}
					if (
						getStylesLayer( parentSources[ i ], setting.paths ) ===
						'block'
					) {
						return {
							type: 'parent',
							parentName: parentNames[ i ],
							via: isFromUserStyles(
								userStyles,
								'block',
								setting.paths,
								parentNames[ i ]
							)
								? 'user'
								: 'theme',
						};
					}
				}
			}
			return layer ? stylesOrigin( layer ) : undefined;
		};

		const own: Row[] = [];
		const inherited: Row[] = [];
		for ( const setting of getStyleSettings() ) {
			const origin = getOrigin( setting );
			const isOwn = isSetOnBlock( attributes, setting );
			const row = {
				setting,
				origin,
				notes: getCSSNotes(
					setting,
					name,
					blockTitle,
					attributes?.style?.css,
					mergedStyles,
					isOwn || !! origin
				),
			};
			if ( isOwn ) {
				own.push( row );
			} else if ( row.origin || row.notes.length ) {
				inherited.push( row );
			}
		}
		return { ownRows: own, inheritedRows: inherited };
	}, [
		name,
		blockTitle,
		attributes,
		sources,
		userStyles,
		mergedStyles,
		variationName,
		elements,
		parentNames,
		parentAttributes,
		parentSources,
	] );

	if ( ! ownRows.length && ! inheritedRows.length ) {
		return null;
	}

	const themeRowCount = inheritedRows.filter( isThemeOnly ).length;

	return (
		<>
			{ !! ownRows.length && (
				<StyleList
					title={ __( 'Styles set on this block' ) }
					rows={ ownRows }
					describe={ ( { origin } ) =>
						origin
							? sprintf(
									/* translators: %s: Where the overridden value comes from, e.g. "the theme’s styles for Pullquote blocks". */
									__( 'Overrides %s.' ),
									getOriginPhrase( origin, names )
								)
							: __( 'Only set on this block.' )
					}
				/>
			) }
			{ !! inheritedRows.length && (
				<StyleList
					title={ __( 'Styles this block inherits' ) }
					rows={
						showThemeRows
							? inheritedRows
							: inheritedRows.filter(
									( row ) => ! isThemeOnly( row )
								)
					}
					describe={ ( { origin } ) =>
						origin
							? sprintf(
									/* translators: %s: Where the value comes from, e.g. "the Group block it is inside". */
									__( 'From %s.' ),
									getOriginPhrase( origin, names )
								)
							: null
					}
				>
					{ !! themeRowCount && (
						<Button
							variant="link"
							className="block-editor-style-overrides__toggle"
							aria-expanded={ showThemeRows }
							onClick={ () =>
								setShowThemeRows( ! showThemeRows )
							}
						>
							{ showThemeRows
								? __( 'Hide styles from the theme' )
								: sprintf(
										/* translators: %d: Number of styles that come from the theme. */
										_n(
											'Show %d style from the theme',
											'Show %d styles from the theme',
											themeRowCount
										),
										themeRowCount
									) }
						</Button>
					) }
				</StyleList>
			) }
		</>
	);
}

function StyleOverridesPanel( props: StyleOverridesPanelProps ) {
	const blockEditingMode = useBlockEditingMode();
	if ( blockEditingMode !== 'default' ) {
		return null;
	}
	return (
		<InspectorControls group="advanced">
			<StyleOrigins { ...props } />
		</InspectorControls>
	);
}

export default {
	edit: StyleOverridesPanel,
	hasSupport() {
		return isGlobalStylesInheritanceIndicatorUIEnabled();
	},
};
