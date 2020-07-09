/**
 * External dependencies
 */
import { ScrollView } from 'react-native';
import { map } from 'lodash';

/**
 * WordPress dependencies
 */

import { withSelect, useDispatch } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	BottomSheet,
	UnsupportedFooterControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import MenuItem from '../inserter/menu-item';
import styles from './style.scss';

function BlockVariationPicker( { isVisible, onClose, clientId, variations } ) {
	const createBlocksFromInnerBlocksTemplate = ( innerBlocksTemplate ) => {
		return map(
			innerBlocksTemplate,
			( [ name, attributes, innerBlocks = [] ] ) =>
				createBlock(
					name,
					attributes,
					createBlocksFromInnerBlocksTemplate( innerBlocks )
				)
		);
	};
	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

	return (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			title={ __( 'Select a preset' ) }
			contentStyle={ styles.contentStyle }
		>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={ false }
				contentContainerStyle={ styles.contentContainerStyle }
				style={ styles.containerStyle }
			>
				{ variations.map( ( v ) => {
					return (
						<MenuItem
							item={ v }
							key={ v.name }
							onSelect={ () => {
								replaceInnerBlocks(
									clientId,
									createBlocksFromInnerBlocksTemplate(
										v.innerBlocks
									)
								);
								onClose();
							} }
						/>
					);
				} ) }
			</ScrollView>
			<PanelBody>
				<UnsupportedFooterControl
					label={ __( 'Note: columns may stack on small screens' ) }
					textAlign="center"
				/>
			</PanelBody>
		</BottomSheet>
	);
}

export default compose(
	withSelect( ( select, {} ) => {
		const { getBlockVariations } = select( 'core/blocks' );

		return {
			date: getBlockVariations( 'core/columns', 'block' ),
		};
	} ),
	withPreferredColorScheme
)( BlockVariationPicker );
