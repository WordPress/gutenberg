/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import Inserter from '../inserter';

export const Appender = forwardRef( ( { rootClientId, ...props }, ref ) => {
	const { hideInserter } = useSelect(
		( select ) => {
			const { getTemplateLock, __unstableGetEditorMode } =
				select( blockEditorStore );

			return {
				hideInserter:
					!! getTemplateLock( rootClientId ) ||
					__unstableGetEditorMode() === 'zoom-out',
			};
		},
		[ rootClientId ]
	);

	if ( hideInserter ) {
		return null;
	}

	return (
		<div className="offcanvas-editor__appender">
			<Inserter
				ref={ ref }
				rootClientId={ rootClientId }
				position="bottom right"
				isAppender
				__experimentalIsQuick
				{ ...props }
			/>
		</div>
	);
} );
