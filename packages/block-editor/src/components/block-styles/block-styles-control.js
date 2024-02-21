/**
 * WordPress dependencies
 */
import {
	ColorIndicator,
	Flex,
	FlexItem,
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getDefaultStyle } from './utils';

const { CustomSelect, CustomSelectItem } = unlock( componentsPrivateApis );

function BlockStyleItem( { blockStyle: { styles, label } } ) {
	const indicators = [ styles?.color?.background, styles?.color?.text ];

	return (
		<HStack justify="flex-start">
			<ZStack isLayered={ false } offset={ -8 }>
				{ indicators.map( ( indicator, index ) => (
					<Flex key={ index } expanded={ false }>
						<ColorIndicator colorValue={ indicator } />
					</Flex>
				) ) }
			</ZStack>
			<FlexItem title={ label }>{ label }</FlexItem>
		</HStack>
	);
}

export default function BlockStylesControl( props ) {
	const { value, blockStyles, onChange, onHover } = props;
	const defaultStyle = getDefaultStyle( blockStyles );

	const renderSelectedBlockStyle = ( currentStyle ) => {
		const currentBlockStyle = blockStyles.find(
			( style ) => style.name === currentStyle
		);

		if ( ! currentBlockStyle ) {
			return null;
		}

		return <BlockStyleItem blockStyle={ currentBlockStyle } />;
	};

	return (
		<CustomSelect
			className="block-editor-block-styles__button"
			defaultValue={ defaultStyle?.name }
			label={ __( 'Select a block style' ) }
			onChange={ onChange }
			renderSelectedValue={ renderSelectedBlockStyle }
			value={ value?.name }
			hideLabelFromVision
			popoverProps={ { className: 'block-editor-block-styles__popover' } }
		>
			{ blockStyles.map( ( blockStyle, index ) => (
				<CustomSelectItem
					key={ index }
					value={ blockStyle.name }
					onMouseEnter={ () => onHover( blockStyle ) }
					onMouseLeave={ () => onHover( null ) }
					onFocus={ () => onHover( blockStyle ) }
					onBlur={ () => onHover( null ) }
				>
					<BlockStyleItem blockStyle={ blockStyle } />
				</CustomSelectItem>
			) ) }
		</CustomSelect>
	);
}
