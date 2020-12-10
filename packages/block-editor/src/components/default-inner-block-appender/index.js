/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import Inserter from '../inserter';

export function DefaultInnerBlockAppender( {
	rootClientId,
	lastBlockClientId,
} ) {
	const { isLocked, orientation } = useSelect(
		( select ) => {
			const { getTemplateLock, getBlockListSettings } = select(
				blockEditorStore
			);

			return {
				isLocked: !! getTemplateLock( rootClientId ),
				orientation: getBlockListSettings( rootClientId )?.orientation,
			};
		},
		[ rootClientId, lastBlockClientId ]
	);

	if ( isLocked ) {
		return null;
	}

	return (
		<div
			className={ classnames(
				'block-editor-default-inner-block-appender',
				'is-' + orientation
			) }
		>
			<Inserter
				rootClientId={ rootClientId }
				position="bottom right"
				isAppender
				__experimentalIsQuick
			/>
		</div>
	);
}

export default DefaultInnerBlockAppender;
