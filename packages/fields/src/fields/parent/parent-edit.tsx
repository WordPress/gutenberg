/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import { ComboboxControl, ExternalLink, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	createInterpolateElement,
	useCallback,
	useMemo,
	useState,
} from '@wordpress/element';
// @ts-ignore
import { store as coreStore } from '@wordpress/core-data';
// @ts-ignore
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { debounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { getTitleWithFallbackName } from './utils';
// @ts-ignore
import { unlock } from '../../lock-unlock';

// Get the postPickerKey symbol from block editor private APIs
const { postPickerKey } = unlock( blockEditorPrivateApis );

type TreeBase = {
	id: number;
	name: string;
	[ key: string ]: any;
};

type TreeWithParent = TreeBase & {
	parent: number;
};

type TreeWithoutParent = TreeBase & {
	parent: null;
};

type Tree = TreeWithParent | TreeWithoutParent;

function buildTermsTree( flatTerms: Tree[] ) {
	const flatTermsWithParentAndChildren = flatTerms.map( ( term ) => {
		return {
			children: [],
			...term,
		};
	} );

	// All terms should have a `parent` because we're about to index them by it.
	if (
		flatTermsWithParentAndChildren.some(
			( { parent } ) => parent === null || parent === undefined
		)
	) {
		return flatTermsWithParentAndChildren as TreeWithParent[];
	}

	const termsByParent = (
		flatTermsWithParentAndChildren as TreeWithParent[]
	 ).reduce(
		( acc, term ) => {
			const { parent } = term;
			if ( ! acc[ parent ] ) {
				acc[ parent ] = [];
			}
			acc[ parent ].push( term );
			return acc;
		},
		{} as Record< string, Array< TreeWithParent > >
	);

	const fillWithChildren = (
		terms: Array< TreeWithParent >
	): Array< TreeWithParent > => {
		return terms.map( ( term ) => {
			const children = termsByParent[ term.id ];
			return {
				...term,
				children:
					children && children.length
						? fillWithChildren( children )
						: [],
			};
		} );
	};

	return fillWithChildren( termsByParent[ '0' ] || [] );
}

export const getItemPriority = ( name: string, searchValue: string ) => {
	const normalizedName = removeAccents( name || '' ).toLowerCase();
	const normalizedSearch = removeAccents( searchValue || '' ).toLowerCase();
	if ( normalizedName === normalizedSearch ) {
		return 0;
	}

	if ( normalizedName.startsWith( normalizedSearch ) ) {
		return normalizedName.length;
	}

	return Infinity;
};

export function PageAttributesParent( {
	data,
	onChangeControl,
}: {
	data: BasePost;
	onChangeControl: ( newValue: number ) => void;
} ) {
	const [ fieldValue, setFieldValue ] = useState< null | string >( null );

	const pageId = data.parent;
	const postId = data.id;
	const postTypeSlug = data.type;

	// Get the openPostPicker function from block editor settings
	const openPostPicker = useSelect( ( select ) => {
		try {
			// Try to get from block editor store
			const blockEditorSettings =
				select( blockEditorStore ).getSettings();
			return blockEditorSettings?.[ postPickerKey ];
		} catch ( e ) {
			// blockEditorStore might not be available in all contexts
		}
		return undefined;
	}, [] );

	const { parentPostTitle, pageItems, isHierarchical } = useSelect(
		( select ) => {
			const { getEntityRecord, getEntityRecords, getPostType } =
				select( coreStore );

			const postTypeInfo = getPostType( postTypeSlug );

			const postIsHierarchical =
				postTypeInfo?.hierarchical && postTypeInfo.viewable;

			const parentPost = pageId
				? getEntityRecord< BasePost >(
						'postType',
						postTypeSlug,
						pageId
				  )
				: null;

			const query = {
				per_page: 100,
				exclude: postId,
				parent_exclude: postId,
				orderby: 'menu_order',
				order: 'asc',
				_fields: 'id,title,parent',
				...( fieldValue !== null && {
					search: fieldValue,
				} ),
			};

			return {
				isHierarchical: postIsHierarchical,
				parentPostTitle: parentPost
					? getTitleWithFallbackName( parentPost )
					: '',
				pageItems: postIsHierarchical
					? getEntityRecords< BasePost >(
							'postType',
							postTypeSlug,
							query
					  )
					: null,
			};
		},
		[ fieldValue, pageId, postId, postTypeSlug ]
	);

	/**
	 * This logic has been copied from https://github.com/WordPress/gutenberg/blob/0249771b519d5646171fb9fae422006c8ab773f2/packages/editor/src/components/page-attributes/parent.js#L106.
	 */
	const parentOptions = useMemo( () => {
		const getOptionsFromTree = (
			tree: Array< Tree >,
			level = 0
		): Array< {
			value: number;
			label: string;
			rawName: string;
		} > => {
			const mappedNodes = tree.map( ( treeNode ) => [
				{
					value: treeNode.id,
					label:
						'— '.repeat( level ) + decodeEntities( treeNode.name ),
					rawName: treeNode.name,
				},
				...getOptionsFromTree( treeNode.children || [], level + 1 ),
			] );

			const sortedNodes = mappedNodes.sort( ( [ a ], [ b ] ) => {
				const priorityA = getItemPriority(
					a.rawName,
					fieldValue ?? ''
				);
				const priorityB = getItemPriority(
					b.rawName,
					fieldValue ?? ''
				);
				return priorityA >= priorityB ? 1 : -1;
			} );

			return sortedNodes.flat();
		};

		if ( ! pageItems ) {
			return [];
		}

		let tree = pageItems.map( ( item ) => ( {
			id: item.id as number,
			parent: item.parent ?? null,
			name: getTitleWithFallbackName( item ),
		} ) );

		// Only build a hierarchical tree when not searching.
		if ( ! fieldValue ) {
			tree = buildTermsTree( tree );
		}

		const opts = getOptionsFromTree( tree );

		// Ensure the current parent is in the options list.
		const optsHasParent = opts.find( ( item ) => item.value === pageId );
		if ( pageId && parentPostTitle && ! optsHasParent ) {
			opts.unshift( {
				value: pageId,
				label: parentPostTitle,
				rawName: '',
			} );
		}
		return opts.map( ( option ) => ( {
			...option,
			value: option.value.toString(),
		} ) );
	}, [ pageItems, fieldValue, parentPostTitle, pageId ] );

	/**
	 * Handle user input.
	 *
	 * @param {string} inputValue The current value of the input field.
	 */
	const handleKeydown = ( inputValue: string ) => {
		setFieldValue( inputValue );
	};

	/**
	 * Handle author selection.
	 *
	 * @param {Object} selectedPostId The selected Author.
	 */
	const handleChange = ( selectedPostId: string | null | undefined ) => {
		if ( selectedPostId ) {
			return onChangeControl( parseInt( selectedPostId, 10 ) ?? 0 );
		}

		onChangeControl( 0 );
	};

	const handlePostPickerSelect = useCallback(
		( selectedPostId: number ) => {
			onChangeControl( selectedPostId );
		},
		[ onChangeControl ]
	);

	if ( ! isHierarchical ) {
		return null;
	}

	// Use PostPicker with ComboBox if available, otherwise use ComboBox alone
	return (
		<div>
			<ComboboxControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Parent' ) }
				help={ __( 'Choose a parent page.' ) }
				value={ pageId?.toString() }
				options={ parentOptions }
				onFilterValueChange={ debounce(
					( value: unknown ) => handleKeydown( value as string ),
					300
				) }
				onChange={ handleChange }
				hideLabelFromVision
			/>
			{ openPostPicker && (
				<Button
					variant="secondary"
					onClick={ () =>
						openPostPicker( {
							postType: postTypeSlug,
							excludePostId: postId,
							onSelect: handlePostPickerSelect,
							title: sprintf(
								/* translators: %s: post type name */
								__( 'Select Parent %s' ),
								postTypeSlug
							),
						} )
					}
					__next40pxDefaultSize
					style={ { marginTop: '8px', width: '100%' } }
				>
					{ pageId ? __( 'Change Parent' ) : __( 'Select Parent' ) }
				</Button>
			) }
		</div>
	);
}

export const ParentEdit = ( {
	data,
	field,
	onChange,
}: DataFormControlProps< BasePost > ) => {
	const { id } = field;

	const homeUrl = useSelect( ( select ) => {
		return select( coreStore ).getEntityRecord< {
			home: string;
		} >( 'root', '__unstableBase' )?.home as string;
	}, [] );

	const onChangeControl = useCallback(
		( newValue?: number ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	return (
		<fieldset className="fields-controls__parent">
			<div>
				{ createInterpolateElement(
					sprintf(
						/* translators: %1$s The home URL of the WordPress installation without the scheme. */
						__(
							'Child pages inherit characteristics from their parent, such as URL structure. For instance, if "Pricing" is a child of "Services", its URL would be %1$s<wbr />/services<wbr />/pricing.'
						),
						filterURLForDisplay( homeUrl ).replace(
							/([/.])/g,
							'<wbr />$1'
						)
					),
					{
						wbr: <wbr />,
					}
				) }
				<p>
					{ createInterpolateElement(
						__(
							'They also show up as sub-items in the default navigation menu. <a>Learn more.</a>'
						),
						{
							a: (
								<ExternalLink
									href={ __(
										'https://wordpress.org/documentation/article/page-post-settings-sidebar/#page-attributes'
									) }
									children={ undefined }
								/>
							),
						}
					) }
				</p>
				<PageAttributesParent
					data={ data }
					onChangeControl={ onChangeControl }
				/>
			</div>
		</fieldset>
	);
};
