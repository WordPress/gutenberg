/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import classnames from 'classnames';

const baseClassName = 'wp-block-template-part__content-lock';

export default function ContentLock( { clientId, children } ) {
	const { isSelected, hasChildSelected, isBlockFocused } = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				hasSelectedInnerBlock,
				getFocusedBlock,
			} = select( blockEditorStore );
			return {
				isSelected: isBlockSelected( clientId ),
				hasChildSelected: hasSelectedInnerBlock( clientId, true ),
				isBlockFocused: getFocusedBlock() === clientId,
			};
		},
		[ clientId ]
	);
	const selectBlock = useDispatch( blockEditorStore ).selectBlock;

	const classes = classnames( baseClassName, {
		'parent-selected': isSelected,
		'child-selected': hasChildSelected,
		'parent-focused': isBlockFocused,
	} );

	const onClick = ! ( isSelected || hasChildSelected )
		? () => selectBlock( clientId )
		: null;

	return (
		<div className={ classes }>
			<button
				className={ `${ baseClassName }-overlay` }
				onClick={ onClick }
			/>
			<div className={ `${ baseClassName }-content-wrapper` }>
				{ children }
			</div>
		</div>
	);
}
