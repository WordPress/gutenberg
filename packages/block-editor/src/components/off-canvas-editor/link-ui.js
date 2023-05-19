// Note: this file is copied directly from packages/block-library/src/navigation-link/link-ui.js

/**
 * WordPress dependencies
 */
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { Popover, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { switchToBlockType } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import LinkControl from '../link-control';
import BlockIcon from '../block-icon';

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
			return {};
	}
}

/**
 * Add transforms to Link Control
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client ID.
 */
function LinkControlTransforms( { clientId } ) {
	const { getBlock, blockTransforms } = useSelect(
		( select ) => {
			const {
				getBlock: _getBlock,
				getBlockRootClientId,
				getBlockTransformItems,
			} = select( blockEditorStore );

			return {
				getBlock: _getBlock,
				blockTransforms: getBlockTransformItems(
					_getBlock( clientId ),
					getBlockRootClientId( clientId )
				),
			};
		},
		[ clientId ]
	);

	const { replaceBlock } = useDispatch( blockEditorStore );

	const featuredBlocks = [
		'core/page-list',
		'core/site-logo',
		'core/social-links',
		'core/search',
	];

	const transforms = blockTransforms.filter( ( item ) => {
		return featuredBlocks.includes( item.name );
	} );

	if ( ! transforms?.length ) {
		return null;
	}

	if ( ! clientId ) {
		return null;
	}

	return (
		<div className="link-control-transform">
			<h3 className="link-control-transform__subheading">
				{ __( 'Transform' ) }
			</h3>
			<div className="link-control-transform__items">
				{ transforms.map( ( item ) => {
					return (
						<Button
							key={ `transform-${ item.name }` }
							onClick={ () =>
								replaceBlock(
									clientId,
									switchToBlockType(
										getBlock( clientId ),
										item.name
									)
								)
							}
							className="link-control-transform__item"
						>
							<BlockIcon icon={ item.icon } />
							{ item.title }
						</Button>
					);
				} ) }
			</div>
		</div>
	);
}

export function LinkUI( props ) {
	const { label, url, opensInNewTab, type, kind } = props.link;
	const link = {
		url,
		opensInNewTab,
		title: label && stripHTML( label ),
	};

	return (
		<Popover
			placement="bottom"
			onClose={ props.onClose }
			anchor={ props.anchor }
			shift
		>
			<LinkControl
				hasTextControl
				hasRichPreviews
				className={ props.className }
				value={ link }
				showInitialSuggestions={ true }
				withCreateSuggestion={ props.hasCreateSuggestion }
				noDirectEntry={ !! type }
				noURLSuggestion={ !! type }
				suggestionsQuery={ getSuggestionsQuery( type, kind ) }
				onChange={ props.onChange }
				onRemove={ props.onRemove }
				onCancel={ props.onCancel }
				renderControlBottom={
					! url
						? () => (
								<LinkControlTransforms
									clientId={ props.clientId }
								/>
						  )
						: null
				}
			/>
		</Popover>
	);
}
