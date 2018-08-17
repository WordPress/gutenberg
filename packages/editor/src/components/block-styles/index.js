/**
 * External dependencies
 */
import { find, get } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import TokenList from '@wordpress/token-list';

/**
 * Internal dependencies
 */
import { BlockPreviewContent } from '../block-preview';

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

function BlockStyles( {
	styles,
	className,
	onChangeClassName,
	name,
	attributes,
	onSwitch,
	onHoverClassName,
} ) {
	if ( ! styles ) {
		return null;
	}

	const activeStyle = getActiveStyle( styles, className );
	function updateClassName( style ) {
		const updatedClassName = replaceActiveStyle( className, activeStyle, style );
		onChangeClassName( updatedClassName );
		onSwitch();
	}

	return (
		<div className="editor-block-styles">
			{ styles.map( ( style ) => {
				const styleClassName = replaceActiveStyle( className, activeStyle, style );
				/* eslint-disable jsx-a11y/click-events-have-key-events */
				return (
					<div
						key={ style.name }
						className={ classnames(
							'editor-block-styles__item', {
								'is-active': activeStyle === style,
							}
						) }
						onClick={ () => updateClassName( style ) }
						onMouseEnter={ () => onHoverClassName( styleClassName ) }
						onMouseLeave={ () => onHoverClassName( null ) }
						role="button"
						tabIndex="0"
						aria-label={ sprintf( __( 'Apply style variation "%s"' ), style.label || style.name ) }
					>
						<div className="editor-block-styles__item-preview">
							<BlockPreviewContent
								name={ name }
								attributes={ {
									...attributes,
									className: styleClassName,
								} }
							/>
						</div>
						<div className="editor-block-styles__item-label">
							{ style.label || style.name }
						</div>
					</div>
				);
				/* eslint-enable jsx-a11y/click-events-have-key-events */
			} ) }
		</div>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const block = select( 'core/editor' ).getBlock( clientId );

		return {
			name: block.name,
			attributes: block.attributes,
			className: block.attributes.className || '',
			styles: get( getBlockType( block.name ), [ 'styles' ] ),
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			onChangeClassName( newClassName ) {
				dispatch( 'core/editor' ).updateBlockAttributes( clientId, {
					className: newClassName,
				} );
			},
		};
	} ),
] )( BlockStyles );
