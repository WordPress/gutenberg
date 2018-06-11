/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockIcon from '../block-icon';

export default function BlockIconWithColors( { iconObject, className, ...props } ) {
	return iconObject && (
		<div
			style={ {
				backgroundColor: iconObject.background,
				color: iconObject.foreground,
			} }
			className={ classnames( 'editor-block-icon-with-colors', className ) }
		>
			<BlockIcon icon={ iconObject.src } { ...props } />
		</div>
	);
}
