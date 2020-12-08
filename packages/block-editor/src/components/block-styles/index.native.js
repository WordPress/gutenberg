/**
 * External dependencies
 */
import { ScrollView } from 'react-native';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getActiveStyle, replaceActiveStyle } from './utils';
import StylePreview from './preview';
import containerStyles from './style.scss';

function BlockStyles( { clientId, url } ) {
	const selector = ( select ) => {
		const { getBlock } = select( 'core/block-editor' );
		const { getBlockStyles } = select( blocksStore );
		const block = getBlock( clientId );
		return {
			styles: getBlockStyles( block.name ),
			className: block.attributes.className || '',
		};
	};

	const { styles, className } = useSelect( selector, [ clientId ] );

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	if ( ! styles || styles.length === 0 ) {
		return null;
	}

	const renderedStyles = find( styles, 'isDefault' )
		? styles
		: [
				{
					name: 'default',
					label: _x( 'Default', 'block style' ),
					isDefault: true,
				},
				...styles,
		  ];

	const activeStyle = getActiveStyle( renderedStyles, className );
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={ false }
			contentContainerStyle={ containerStyles.content }
		>
			{ renderedStyles.map( ( style ) => {
				const styleClassName = replaceActiveStyle(
					className,
					activeStyle,
					style
				);
				const isActive = activeStyle === style;

				const onStylePress = () => {
					updateBlockAttributes( clientId, {
						className: styleClassName,
					} );
				};

				return (
					<StylePreview
						onPress={ onStylePress }
						isActive={ isActive }
						key={ style.name }
						style={ style }
						url={ url }
					/>
				);
			} ) }
		</ScrollView>
	);
}

export default BlockStyles;
