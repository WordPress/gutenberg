import { __, sprintf } from '@wordpress/i18n';
import { Button, Icon as WCIcon, ToolbarItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { chevronDown } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import BlockIcon from '../../block-icon';
import { useShowHoveredOrFocusedGestures } from '../utils';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

type Parent = { clientId: string; title?: string; icon?: any };

const EMPTY_ARRAY: Parent[] = [];

// Its JSDoc types `highlightParent` as a number.
const useGestures = useShowHoveredOrFocusedGestures as unknown as ( options: {
	ref: unknown;
	highlightParent: boolean;
} ) => Record< string, unknown >;

/**
 * Returns the parents of a block, nearest first, as they're shown in List View
 * (disabled blocks are skipped), with what to call each one.
 *
 * @param clientId The selected block.
 * @return Parents with `clientId`, `title` and `icon`.
 */
function useParentChain( clientId: string ): Parent[] {
	const parents = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getEnabledBlockParents(
				clientId,
				true
			),
		[ clientId ]
	);
	// The store keeps returning the same name, attributes and variation
	// objects until they change, so the shallow comparison holds.
	const details = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			const { getActiveBlockVariation } = select( blocksStore );
			return parents.flatMap( ( parentClientId: string ) => {
				const name = getBlockName( parentClientId ) ?? '';
				const attributes = getBlockAttributes( parentClientId ) ?? {};
				return [
					name,
					attributes,
					getActiveBlockVariation( name, attributes ),
				];
			} );
		},
		[ parents ]
	);
	return useMemo( () => {
		if ( ! parents.length ) {
			return EMPTY_ARRAY;
		}
		return parents.map( ( parentClientId: string, index: number ) => {
			const [ name, attributes, variation ] = details.slice(
				index * 3,
				index * 3 + 3
			) as [ string, any, any ];
			const blockType = getBlockType( name );
			return {
				clientId: parentClientId,
				title:
					attributes?.metadata?.name ||
					variation?.title ||
					blockType?.title,
				icon: variation?.icon || blockType?.icon,
			};
		} );
	}, [ parents, details ] );
}

/**
 * The parent selector, outside the toolbar so the toolbar keeps its place
 * whatever the block hierarchy. It shows the nearest parent, and its menu
 * lists every parent up to the top of the document.
 *
 * @param props          Component props.
 * @param props.clientId The selected block.
 */
export default function ParentChain( { clientId }: { clientId: string } ) {
	const chain = useParentChain( clientId );
	const { selectBlock } = useDispatch( blockEditorStore );
	const nodeRef = useRef< HTMLDivElement >( null );
	const showHoveredOrFocusedGestures = useGestures( {
		ref: nodeRef,
		highlightParent: true,
	} );

	if ( ! chain.length ) {
		return null;
	}

	const [ nearest ] = chain;

	return (
		<div
			ref={ nodeRef }
			className="block-editor-block-toolbar-redesign__parents"
			{ ...showHoveredOrFocusedGestures }
		>
			<Menu.Root>
				<ToolbarItem>
					{ ( itemProps ) => (
						<Menu.Trigger
							render={
								<Button
									{ ...itemProps }
									__next40pxDefaultSize
									className="block-editor-block-toolbar-redesign__parents-button"
									label={ sprintf(
										/* translators: %s: name of the block's parent. */
										__( 'Parent blocks, nearest: %s' ),
										nearest.title ?? ''
									) }
									showTooltip
								/>
							}
						>
							<BlockIcon icon={ nearest.icon } />
							<WCIcon icon={ chevronDown } size={ 16 } />
						</Menu.Trigger>
					) }
				</ToolbarItem>
				<Menu.Popup
					className="block-editor-block-toolbar-redesign__menu"
					positioner={
						<Menu.Positioner side="bottom" align="start" />
					}
				>
					<Menu.Group>
						<Menu.GroupLabel>
							{ __( 'Select parent' ) }
						</Menu.GroupLabel>
						{ [ ...chain ].reverse().map( ( parent, index ) => (
							<Menu.Item
								key={ parent.clientId }
								// Outermost first, each one stepping in, so the
								// list reads like an outline of the page down
								// to the selected block.
								prefix={
									<span
										className="block-editor-block-toolbar-redesign__parents-indent"
										style={ {
											paddingInlineStart: index * 12,
										} }
									>
										<BlockIcon icon={ parent.icon } />
									</span>
								}
								onClick={ () => selectBlock( parent.clientId ) }
							>
								<Menu.ItemLabel>
									{ parent.title }
								</Menu.ItemLabel>
							</Menu.Item>
						) ) }
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
		</div>
	);
}
