/**
 * External dependencies
 */
import { find, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import TokenList from '@wordpress/token-list';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { _x } from '@wordpress/i18n';
import {
	getBlockType,
	cloneBlock,
	getBlockFromExample,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

/**
 * Returns the active style from the given className.
 *
 * @param {Array} styles Block style variations.
 * @param {string} className  Class name
 *
 * @return {Object?} The active style.
 */
export function getActiveStyle( styles, className ) {
	for ( const style of new TokenList( className ).values() ) {
		if ( style.indexOf( 'is-style-' ) === -1 ) {
			continue;
		}

		const potentialStyleName = style.substring( 9 );
		const activeStyle = find( styles, { name: potentialStyleName } );
		if ( activeStyle ) {
			return activeStyle;
		}
	}

	return find( styles, 'isDefault' );
}

/**
 * Replaces the active style in the block's className.
 *
 * @param {string}  className   Class name.
 * @param {Object?} activeStyle The replaced style.
 * @param {Object}  newStyle    The replacing style.
 *
 * @return {string} The updated className.
 */
export function replaceActiveStyle( className, activeStyle, newStyle ) {
	const list = new TokenList( className );

	if ( activeStyle ) {
		list.remove( 'is-style-' + activeStyle.name );
	}

	list.add( 'is-style-' + newStyle.name );

	return list.value;
}

const usePrecomputedPreviewDetails = ( clientId ) => {
	const { block, type, hasStyles, styles } = useBlockDetails( clientId );
	const currentClassName = block.attributes.className || '';
	const activeStyle = getActiveStyle( styles, currentClassName );
	const genericPreviewBlock = useGenericPreviewBlock( block, type );
	const stylesWithPreviewBlocks = useMemo(
		() =>
			styles.map( ( style ) => {
				const styleClassName = replaceActiveStyle(
					currentClassName,
					activeStyle,
					style
				);
				return {
					style,
					className: styleClassName,
					previewBlock: {
						...genericPreviewBlock,
						attributes: {
							...genericPreviewBlock.attributes,
							className: styleClassName,
						},
					},
				};
			} ),
		[ styles ]
	);

	return {
		activeStyle,
		hasStyles,
		stylesWithPreviewBlocks,
	};
};

const useBlockDetails = ( clientId ) =>
	useSelect(
		( select ) => {
			const { getBlock } = select( 'core/block-editor' );
			const { getBlockStyles } = select( 'core/blocks' );
			const block = getBlock( clientId );
			const styles = getBlockStyles( block.name ) || [];
			const type = getBlockType( block.name );
			const hasStyles = styles && styles.length > 0;
			if ( ! type.styles && ! find( styles, 'isDefault' ) ) {
				styles.unshift( {
					name: 'default',
					label: _x( 'Default', 'block style' ),
					isDefault: true,
				} );
			}
			return {
				block,
				hasStyles,
				styles,
				type,
			};
		},
		[ clientId ]
	);

const useGenericPreviewBlock = ( block, type ) =>
	useMemo(
		() =>
			type.example
				? getBlockFromExample( block.name, {
						attributes: type.example.attributes,
						innerBlocks: type.example.innerBlocks,
				  } )
				: cloneBlock( block ),
		[ block, type ]
	);

function BlockStyles( { clientId, onSwitch = noop, onHoverClassName = noop } ) {
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const {
		activeStyle,
		hasStyles,
		stylesWithPreviewBlocks,
	} = usePrecomputedPreviewDetails( clientId );

	if ( ! hasStyles ) {
		return null;
	}

	return (
		<div className="block-editor-block-styles">
			{ stylesWithPreviewBlocks.map(
				( { style, className, previewBlock } ) => (
					<BlockStyleItem
						key={ style.name }
						previewBlock={ previewBlock }
						className={ className }
						isActive={ activeStyle === style }
						onSelect={ () => {
							updateBlockAttributes( clientId, {
								className,
							} );
							onHoverClassName( null );
							onSwitch();
						} }
						onBlur={ () => onHoverClassName( null ) }
						onHover={ () => onHoverClassName( className ) }
						style={ style }
					/>
				)
			) }
		</div>
	);
}

function BlockStyleItem( {
	previewBlock,
	style,
	isActive,
	onBlur,
	onHover,
	onSelect,
} ) {
	return (
		<div
			key={ style.name }
			className={ classnames( 'block-editor-block-styles__item', {
				'is-active': isActive,
			} ) }
			onClick={ () => onSelect() }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					event.preventDefault();
					onSelect();
				}
			} }
			onMouseEnter={ onHover }
			onMouseLeave={ onBlur }
			role="button"
			tabIndex="0"
			aria-label={ style.label || style.name }
		>
			<div className="block-editor-block-styles__item-preview">
				<BlockPreview viewportWidth={ 500 } blocks={ previewBlock } />
			</div>
			<div className="block-editor-block-styles__item-label">
				{ style.label || style.name }
			</div>
		</div>
	);
}

export default BlockStyles;
