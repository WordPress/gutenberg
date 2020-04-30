/**
 * External dependencies
 */
import { find, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
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

function BlockStyles( { clientId, onSwitch = noop, onHoverClassName = noop } ) {
	const selector = ( select ) => {
		const { getBlock } = select( 'core/block-editor' );
		const { getBlockStyles } = select( 'core/blocks' );
		const block = getBlock( clientId );
		const blockType = getBlockType( block.name );
		const useExample = !! blockType.example;
		return {
			useExample,
			blockName: block.name,
			className: block.attributes.className || '',
			styles: getBlockStyles( block.name ),
			type: blockType,
			block: useExample ? null : block,
		};
	};

	const {
		useExample,
		blockName,
		className,
		styles,
		type,
		block,
	} = useSelect( selector, [ clientId ] );

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const onChangeClassName = useCallback(
		( newClassName ) =>
			updateBlockAttributes( clientId, { className: newClassName } ),
		[ updateBlockAttributes, clientId ]
	);

	if ( ! styles || styles.length === 0 ) {
		return null;
	}

	if ( ! type.styles && ! find( styles, 'isDefault' ) ) {
		styles.unshift( {
			name: 'default',
			label: _x( 'Default', 'block style' ),
			isDefault: true,
		} );
	}

	const activeStyle = getActiveStyle( styles, className );
	function updateClassName( style ) {
		const updatedClassName = replaceActiveStyle(
			className,
			activeStyle,
			style
		);
		onChangeClassName( updatedClassName );
		onHoverClassName( null );
		onSwitch();
	}

	return (
		<div className="block-editor-block-styles">
			{ styles.map( ( style ) => {
				const styleClassName = replaceActiveStyle(
					className,
					activeStyle,
					style
				);
				return (
					<div
						key={ style.name }
						className={ classnames(
							'block-editor-block-styles__item',
							{
								'is-active': activeStyle === style,
							}
						) }
						onClick={ () => updateClassName( style ) }
						onKeyDown={ ( event ) => {
							if (
								ENTER === event.keyCode ||
								SPACE === event.keyCode
							) {
								event.preventDefault();
								updateClassName( style );
							}
						} }
						onMouseEnter={ () =>
							onHoverClassName( styleClassName )
						}
						onMouseLeave={ () => onHoverClassName( null ) }
						role="button"
						tabIndex="0"
						aria-label={ style.label || style.name }
					>
						<div className="block-editor-block-styles__item-preview">
							<BlockStylePreview
								type={ type }
								block={ block }
								blockName={ blockName }
								useExample={ useExample }
								styleClassName={ styleClassName }
							/>
						</div>
						<div className="block-editor-block-styles__item-label">
							{ style.label || style.name }
						</div>
					</div>
				);
			} ) }
		</div>
	);
}

function BlockStylePreview( {
	useExample,
	type,
	block,
	blockName,
	styleClassName,
} ) {
	let factory, deps;
	if ( useExample ) {
		factory = () =>
			getBlockFromExample( blockName, {
				attributes: {
					...type.example.attributes,
					className: styleClassName,
				},
				innerBlocks: type.example.innerBlocks,
			} );
		deps = [ useExample, type, blockName, styleClassName ];
	} else {
		factory = () =>
			cloneBlock( block, {
				className: styleClassName,
			} );
		deps = [ block, styleClassName ];
	}

	const previewBlocks = useMemo( factory, deps );

	return <BlockPreview viewportWidth={ 500 } blocks={ previewBlocks } />;
}

export default BlockStyles;
