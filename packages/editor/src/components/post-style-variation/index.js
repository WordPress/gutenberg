/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import { useStyleVariations } from '../global-styles/style-variation-selector';
import { store as editorStore } from '../../store';

const STYLE_VARIATION_META_KEY = '_wp_connected_style_variation';

/**
 * Component to select and connect a style variation to the current post.
 *
 * @return {JSX.Element|null} The post style variation selector.
 */
export default function PostStyleVariation() {
	const { styleVariations, isLoading } = useStyleVariations();

	const { postId, postType, connectedStyleVariation } = useSelect(
		( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			const { getEditedEntityRecord } = select( coreStore );
			const currentPostId = getCurrentPostId();
			const currentPostType = getCurrentPostType();

			const post = getEditedEntityRecord(
				'postType',
				currentPostType,
				currentPostId
			);

			return {
				postId: currentPostId,
				postType: currentPostType,
				connectedStyleVariation:
					post?.meta?.[ STYLE_VARIATION_META_KEY ] || 0,
			};
		},
		[]
	);

	const { editEntityRecord } = useDispatch( coreStore );

	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			anchor: popoverAnchor,
			className: 'editor-post-style-variation__dropdown',
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);

	const handleSelectStyleVariation = ( styleVariationId ) => {
		editEntityRecord( 'postType', postType, postId, {
			meta: {
				[ STYLE_VARIATION_META_KEY ]: styleVariationId,
			},
		} );
	};

	const selectedVariation = styleVariations.find(
		( variation ) => variation.id === connectedStyleVariation
	);

	// If we have a connected style variation ID but haven't loaded the style variation
	// data yet, show a loading message.
	const getDisplayText = () => {
		if ( selectedVariation ) {
			return selectedVariation.title;
		}
		if ( connectedStyleVariation && isLoading ) {
			return __( 'Loading…' );
		}
		return __( 'Default' );
	};
	const displayText = getDisplayText();

	return (
		<PostPanelRow label={ __( 'Style' ) } ref={ setPopoverAnchor }>
			<DropdownMenu
				popoverProps={ popoverProps }
				focusOnMount
				toggleProps={ {
					size: 'compact',
					variant: 'tertiary',
					tooltipPosition: 'middle left',
				} }
				label={ __( 'Style variation options' ) }
				text={ displayText }
				icon={ null }
			>
				{ ( { onClose } ) => (
					<MenuGroup label={ __( 'Style Variations' ) }>
						<MenuItem
							role="menuitemradio"
							isSelected={ connectedStyleVariation === 0 }
							icon={
								connectedStyleVariation === 0 ? check : null
							}
							onClick={ () => {
								handleSelectStyleVariation( 0 );
								onClose();
							} }
						>
							{ __( 'Default' ) }
						</MenuItem>
						{ isLoading && (
							<MenuItem disabled>{ __( 'Loading…' ) }</MenuItem>
						) }
						{ ! isLoading &&
							styleVariations.map( ( styleVariation ) => (
								<MenuItem
									key={ styleVariation.id }
									role="menuitemradio"
									isSelected={
										connectedStyleVariation ===
										styleVariation.id
									}
									icon={
										connectedStyleVariation ===
										styleVariation.id
											? check
											: null
									}
									onClick={ () => {
										handleSelectStyleVariation(
											styleVariation.id
										);
										onClose();
									} }
								>
									{ styleVariation.title }
								</MenuItem>
							) ) }
					</MenuGroup>
				) }
			</DropdownMenu>
		</PostPanelRow>
	);
}
