/**
 * WordPress dependencies
 */
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	Popover,
	Button,
	VisuallyHidden,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalLinkControl as LinkControl,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	createInterpolateElement,
	useMemo,
	useState,
	useRef,
	useEffect,
	forwardRef,
} from '@wordpress/element';
import {
	store as coreStore,
	useResourcePermissions,
} from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useSelect, useDispatch } from '@wordpress/data';
import { chevronLeftSmall, plus } from '@wordpress/icons';
import { useInstanceId, useFocusOnMount } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { PrivateQuickInserter: QuickInserter } = unlock(
	blockEditorPrivateApis
);

/**
 * Given the Link block's type attribute, return the query params to give to
 * /wp/v2/search.
 *
 * @param {string} type Link block's type attribute.
 * @param {string} kind Link block's entity of kind (post-type|taxonomy)
 * @return {{ type?: string, subtype?: string }} Search query params.
 */
export function getSuggestionsQuery( type, kind ) {
	switch ( type ) {
		case 'post':
		case 'page':
			return { type: 'post', subtype: type };
		case 'category':
			return { type: 'term', subtype: 'category' };
		case 'tag':
			return { type: 'term', subtype: 'post_tag' };
		case 'post_format':
			return { type: 'post-format' };
		default:
			if ( kind === 'taxonomy' ) {
				return { type: 'term', subtype: type };
			}
			if ( kind === 'post-type' ) {
				return { type: 'post', subtype: type };
			}
			return {
				// for custom link which has no type
				// always show pages as initial suggestions
				initialSuggestionsSearchOptions: {
					type: 'post',
					subtype: 'page',
					perPage: 20,
				},
			};
	}
}

function LinkUIBlockInserter( { clientId, onBack, onSelectBlock } ) {
	const { rootBlockClientId } = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );

			return {
				rootBlockClientId: getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);

	const focusOnMountRef = useFocusOnMount( 'firstElement' );

	const dialogTitleId = useInstanceId(
		LinkControl,
		`link-ui-block-inserter__title`
	);
	const dialogDescritionId = useInstanceId(
		LinkControl,
		`link-ui-block-inserter__description`
	);

	if ( ! clientId ) {
		return null;
	}

	return (
		<div
			className="link-ui-block-inserter"
			role="dialog"
			aria-labelledby={ dialogTitleId }
			aria-describedby={ dialogDescritionId }
			ref={ focusOnMountRef }
		>
			<VisuallyHidden>
				<h2 id={ dialogTitleId }>{ __( 'Add block' ) }</h2>

				<p id={ dialogDescritionId }>
					{ __( 'Choose a block to add to your Navigation.' ) }
				</p>
			</VisuallyHidden>

			<Button
				className="link-ui-block-inserter__back"
				icon={ chevronLeftSmall }
				onClick={ ( e ) => {
					e.preventDefault();
					onBack();
				} }
				size="small"
			>
				{ __( 'Back' ) }
			</Button>

			<QuickInserter
				rootClientId={ rootBlockClientId }
				clientId={ clientId }
				isAppender={ false }
				prioritizePatterns={ false }
				selectBlockOnInsert
				hasSearch={ false }
				onSelect={ onSelectBlock }
			/>
		</div>
	);
}

function UnforwardedLinkUI( props, ref ) {
	const { label, url, opensInNewTab, type, kind } = props.link;
	const postType = type || 'page';

	const [ addingBlock, setAddingBlock ] = useState( false );
	const [ focusAddBlockButton, setFocusAddBlockButton ] = useState( false );
	const { saveEntityRecord } = useDispatch( coreStore );
	const permissions = useResourcePermissions( {
		kind: 'postType',
		name: postType,
	} );

	async function handleCreate( pageTitle ) {
		const page = await saveEntityRecord( 'postType', postType, {
			title: pageTitle,
			status: 'draft',
		} );

		return {
			id: page.id,
			type: postType,
			// Make `title` property consistent with that in `fetchLinkSuggestions` where the `rendered` title (containing HTML entities)
			// is also being decoded. By being consistent in both locations we avoid having to branch in the rendering output code.
			// Ideally in the future we will update both APIs to utilise the "raw" form of the title which is better suited to edit contexts.
			// e.g.
			// - title.raw = "Yes & No"
			// - title.rendered = "Yes &#038; No"
			// - decodeEntities( title.rendered ) = "Yes & No"
			// See:
			// - https://github.com/WordPress/gutenberg/pull/41063
			// - https://github.com/WordPress/gutenberg/blob/a1e1fdc0e6278457e9f4fc0b31ac6d2095f5450b/packages/core-data/src/fetch/__experimental-fetch-link-suggestions.js#L212-L218
			title: decodeEntities( page.title.rendered ),
			url: page.link,
			kind: 'post-type',
		};
	}

	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/50976#issuecomment-1568226407.
	const link = useMemo(
		() => ( {
			url,
			opensInNewTab,
			title: label && stripHTML( label ),
		} ),
		[ label, opensInNewTab, url ]
	);

	const dialogTitleId = useInstanceId(
		LinkUI,
		`link-ui-link-control__title`
	);
	const dialogDescritionId = useInstanceId(
		LinkUI,
		`link-ui-link-control__description`
	);

	// Selecting a block should close the popover and also remove the (previously) automatically inserted
	// link block so that the newly selected block can be inserted in its place.
	const { onClose: onSelectBlock } = props;

	return (
		<Popover
			ref={ ref }
			placement="bottom"
			onClose={ props.onClose }
			anchor={ props.anchor }
			shift
		>
			{ ! addingBlock && (
				<div
					role="dialog"
					aria-labelledby={ dialogTitleId }
					aria-describedby={ dialogDescritionId }
				>
					<VisuallyHidden>
						<h2 id={ dialogTitleId }>{ __( 'Add link' ) }</h2>

						<p id={ dialogDescritionId }>
							{ __(
								'Search for and add a link to your Navigation.'
							) }
						</p>
					</VisuallyHidden>
					<LinkControl
						hasTextControl
						hasRichPreviews
						value={ link }
						showInitialSuggestions
						withCreateSuggestion={ permissions.canCreate }
						createSuggestion={ handleCreate }
						createSuggestionButtonText={ ( searchTerm ) => {
							let format;

							if ( type === 'post' ) {
								/* translators: %s: search term. */
								format = __(
									'Create draft post: <mark>%s</mark>'
								);
							} else {
								/* translators: %s: search term. */
								format = __(
									'Create draft page: <mark>%s</mark>'
								);
							}

							return createInterpolateElement(
								sprintf( format, searchTerm ),
								{
									mark: <mark />,
								}
							);
						} }
						noDirectEntry={ !! type }
						noURLSuggestion={ !! type }
						suggestionsQuery={ getSuggestionsQuery( type, kind ) }
						onChange={ props.onChange }
						onRemove={ props.onRemove }
						onCancel={ props.onCancel }
						renderControlBottom={ () =>
							! link?.url?.length && (
								<LinkUITools
									focusAddBlockButton={ focusAddBlockButton }
									setAddingBlock={ () => {
										setAddingBlock( true );
										setFocusAddBlockButton( false );
									} }
								/>
							)
						}
					/>
				</div>
			) }

			{ addingBlock && (
				<LinkUIBlockInserter
					clientId={ props.clientId }
					onBack={ () => {
						setAddingBlock( false );
						setFocusAddBlockButton( true );
					} }
					onSelectBlock={ onSelectBlock }
				/>
			) }
		</Popover>
	);
}

export const LinkUI = forwardRef( UnforwardedLinkUI );

const LinkUITools = ( { setAddingBlock, focusAddBlockButton } ) => {
	const blockInserterAriaRole = 'listbox';
	const addBlockButtonRef = useRef();

	// Focus the add block button when the popover is opened.
	useEffect( () => {
		if ( focusAddBlockButton ) {
			addBlockButtonRef.current?.focus();
		}
	}, [ focusAddBlockButton ] );

	return (
		<VStack className="link-ui-tools">
			<Button
				ref={ addBlockButtonRef }
				icon={ plus }
				onClick={ ( e ) => {
					e.preventDefault();
					setAddingBlock( true );
				} }
				aria-haspopup={ blockInserterAriaRole }
			>
				{ __( 'Add block' ) }
			</Button>
		</VStack>
	);
};

export default LinkUITools;
