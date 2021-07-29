/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { InserterListboxItem } from '../inserter-listbox';

/**
 * Return true if platform is MacOS.
 *
 * @param {Object} _window window object by default; used for DI testing.
 *
 * @return {boolean} True if MacOS; false otherwise.
 */
function isAppleOS( _window = window ) {
	const { platform } = _window.navigator;

	return (
		platform.indexOf( 'Mac' ) !== -1 ||
		[ 'iPad', 'iPhone' ].includes( platform )
	);
}

function InserterListItem( {
	className,
	isFirst,
	item,
	onSelect,
	onHover,
	...props
} ) {
	const itemIconStyle = item.icon
		? {
				backgroundColor: item.icon.background,
				color: item.icon.foreground,
		  }
		: {};

	return (
		<div className="block-editor-block-types-list__list-item">
			<InserterListboxItem
				isFirst={ isFirst }
				className={ classnames(
					'block-editor-block-types-list__item',
					className
				) }
				disabled={ item.isDisabled }
				onClick={ ( event ) => {
					event.preventDefault();
					onSelect(
						item,
						isAppleOS() ? event.metaKey : event.ctrlKey
					);
					onHover( null );
				} }
				onKeyDown={ ( event ) => {
					const { keyCode } = event;
					if ( keyCode === ENTER ) {
						event.preventDefault();
						onSelect(
							item,
							isAppleOS() ? event.metaKey : event.ctrlKey
						);
						onHover( null );
					}
				} }
				onFocus={ () => {
					onHover( item );
				} }
				onMouseEnter={ () => {
					onHover( item );
				} }
				onMouseLeave={ () => onHover( null ) }
				onBlur={ () => onHover( null ) }
				{ ...props }
			>
				<span
					className="block-editor-block-types-list__item-icon"
					style={ itemIconStyle }
				></span>
				<span className="block-editor-block-types-list__item-title">
					{ item.title }
				</span>
			</InserterListboxItem>
		</div>
	);
}

export default memo( InserterListItem );
