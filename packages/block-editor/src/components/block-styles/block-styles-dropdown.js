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
	Icon,
	MenuGroup,
	MenuItem,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';

const checkIcon = <Icon icon={ check } size={ 24 } />;
const noop = () => undefined;

function BlockStyleColorIndicator( { blockStyle } ) {
	const { background, gradient, text } = blockStyle?.styles?.color || {};
	const label = blockStyle?.label || blockStyle?.name;

	return (
		<HStack justify="flex-start">
			<ZStack isLayered={ false } offset={ -8 }>
				<Flex expanded={ false }>
					<ColorIndicator colorValue={ gradient ?? background } />
				</Flex>
				<Flex expanded={ false }>
					<ColorIndicator colorValue={ text } />
				</Flex>
			</ZStack>
			<FlexItem title={ label }>{ label }</FlexItem>
		</HStack>
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

	return (
		<Button __next40pxDefaultSize { ...toggleProps }>
			<BlockStyleColorIndicator blockStyle={ blockStyle } />
		</Button>
	);
}

function BlockStylesDropdownContent( {
	activeStyle,
	handlePreview,
	onSelect,
	styles,
} ) {
	return (
		<MenuGroup
			className="block-editor-block-styles__dropdown-group"
			label={ __( 'Block styles' ) }
		>
			{ styles.map( ( style ) => {
				const isSelected = activeStyle?.name === style.name;

				return (
					<MenuItem
						isSelected={ isSelected }
						key={ style.name }
						onBlur={ () => handlePreview( null ) }
						onClick={ () => onSelect( style ) }
						onFocus={ () => handlePreview( style ) }
						onMouseEnter={ () => handlePreview( style ) }
						onMouseLeave={ () => handlePreview( null ) }
						role="menuitemradio"
						suffix={ isSelected ? checkIcon : undefined }
					>
						<BlockStyleColorIndicator blockStyle={ style } />
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
}

export default function BlockStylesDropdown( {
	className,
	handlePreview = noop,
	onSelect = noop,
	styles,
	value,
	...props
} ) {
	if ( ! styles?.length ) {
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
					handlePreview={ handlePreview }
					onSelect={ onSelect }
					styles={ styles }
				/>
			) }
		/>
	);
}
