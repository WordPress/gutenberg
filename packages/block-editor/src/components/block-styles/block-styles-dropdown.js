/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	ColorIndicator,
	Dropdown,
	Flex,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	__experimentalZStack as ZStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const noop = () => undefined;

function BlockStyleColorCard( { blockStyle } ) {
	const textColor = blockStyle?.styles?.color?.text;
	const linkColor = blockStyle?.styles?.elements?.link?.color?.text;

	return (
		<HStack justify="space-around">
			<Flex expanded={ false }>
				<ColorIndicator colorValue={ textColor } />
			</Flex>
			<Flex expanded={ false }>
				<ColorIndicator colorValue={ linkColor } />
			</Flex>
		</HStack>
	);
}

function BlockStyleButton( {
	handlePreview,
	isSelected,
	onClick,
	blockStyle,
} ) {
	// If the block style variation does not contain color values,
	// render a textual label to cover styles such as the Button's
	// Outline, or Image's Rounded, block styles.
	const { label, name } = blockStyle;
	const { background, gradient, text } = blockStyle.styles?.color || {};
	const hasColors = background || gradient || text;
	const styles = {
		background: gradient,
		backgroundColor: gradient ? undefined : background,
	};

	return (
		<Button
			aria-current={ isSelected }
			className={ classnames( 'block-editor-block-styles__item', {
				'is-active': isSelected,
			} ) }
			label={ blockStyle.label || blockStyle.name }
			onBlur={ () => handlePreview( null ) }
			onClick={ () => onClick( blockStyle ) }
			onFocus={ () => handlePreview( blockStyle ) }
			onMouseEnter={ () => handlePreview( blockStyle ) }
			onMouseLeave={ () => handlePreview( null ) }
			style={ styles }
			variant="secondary"
			__next40pxDefaultSize
		>
			{ hasColors && <BlockStyleColorCard blockStyle={ blockStyle } /> }
			{ ! hasColors && (
				<Truncate
					numberOfLines={ 1 }
					classsName="block-editor-block-styles__item-text"
				>
					{ label || name }
				</Truncate>
			) }
		</Button>
	);
}

function BlockStylesDropdownToggle( { onToggle, isOpen, blockStyle } ) {
	const toggleProps = {
		onClick: onToggle,
		className: classnames( 'block-editor-block-styles__dropdown-toggle', {
			'is-open': isOpen,
		} ),
		'aria-expanded': isOpen,
		'aria-label': __( 'Block style options' ),
	};

	const { background, gradient, text } = blockStyle?.styles?.color || {};
	const linkColor = blockStyle?.styles?.elements?.link?.color?.text;
	const label = blockStyle?.label || blockStyle?.name;
	const hasColors = gradient || background || text || linkColor;

	return (
		<Button __next40pxDefaultSize { ...toggleProps }>
			<HStack justify="flex-start">
				{ hasColors && (
					<ZStack isLayered={ false } offset={ -8 }>
						<Flex expanded={ false }>
							<ColorIndicator
								colorValue={ gradient ?? background }
							/>
						</Flex>
						<Flex expanded={ false }>
							<ColorIndicator colorValue={ text } />
						</Flex>
						{ !! linkColor && (
							<Flex expanded={ false }>
								<ColorIndicator colorValue={ linkColor } />
							</Flex>
						) }
					</ZStack>
				) }
				<FlexItem title={ label }>{ label }</FlexItem>
			</HStack>
		</Button>
	);
}

function BlockStylesDropdownContent( {
	activeStyle,
	blockStyles,
	handlePreview,
	onSelect,
	...props
} ) {
	return (
		<div className="block-editor-block-styles__variants" { ...props }>
			{ blockStyles.map( ( style ) => {
				return (
					<BlockStyleButton
						blockStyle={ style }
						handlePreview={ handlePreview }
						isSelected={ activeStyle?.name === style.name }
						onClick={ onSelect }
						key={ style.name }
					/>
				);
			} ) }
		</div>
	);
}

export default function BlockStylesDropdown( {
	className,
	handlePreview = noop,
	onSelect = noop,
	blockStyles,
	value,
	...props
} ) {
	if ( ! blockStyles?.length ) {
		return null;
	}

	const classes = classnames(
		className,
		'block-editor-block-styles__dropdown'
	);

	return (
		<Dropdown
			{ ...props }
			label={ __( 'Block styles' ) }
			className={ classes }
			renderToggle={ ( toggleProps ) => (
				<BlockStylesDropdownToggle
					{ ...toggleProps }
					blockStyle={ value }
				/>
			) }
			renderContent={ ( contentProps ) => (
				<BlockStylesDropdownContent
					{ ...contentProps }
					activeStyle={ value }
					blockStyles={ blockStyles }
					handlePreview={ handlePreview }
					onSelect={ onSelect }
				/>
			) }
		/>
	);
}
