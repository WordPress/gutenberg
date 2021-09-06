/**
 * External dependencies
 */
import { ScrollView } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect, useDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	BottomSheet,
	FooterMessageControl,
	InserterButton,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function BlockVariationPicker( { isVisible, onClose, clientId, variations } ) {
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const onVariationSelect = ( variation ) => {
		replaceInnerBlocks(
			clientId,
			createBlocksFromInnerBlocksTemplate( variation.innerBlocks )
		);
		onClose();
	};

	return useMemo(
		() => (
			<BottomSheet isVisible={ isVisible } hideHeader={ true }>
				<BottomSheet.NavBar>
					<BottomSheet.NavBar.DismissButton onPress={ onClose } />
					<BottomSheet.NavBar.Heading>
						{ __( 'Select a layout' ) }
					</BottomSheet.NavBar.Heading>
				</BottomSheet.NavBar>
				<ScrollView horizontal showsHorizontalScrollIndicator={ false }>
					{ variations.map( ( v ) => {
						return (
							<InserterButton
								item={ v }
								key={ v.name }
								onSelect={ () => onVariationSelect( v ) }
							/>
						);
					} ) }
				</ScrollView>
				<PanelBody>
					<FooterMessageControl
						label={ __(
							'Note: Column layout may vary between themes and screen sizes'
						) }
					/>
				</PanelBody>
			</BottomSheet>
		),
		[ variations, isVisible, onClose ]
	);
}

export default compose(
	withSelect( ( select, {} ) => {
		const { getBlockVariations } = select( blocksStore );

		return {
			date: getBlockVariations( 'core/columns', 'block' ),
		};
	} )
)( BlockVariationPicker );
