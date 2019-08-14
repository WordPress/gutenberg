/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, Toolbar, Slot } from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { withSafeTimeout } from '@wordpress/compose';
import { RichText, BlockFormatControls } from '@wordpress/block-editor';

function Edit( { attributes, setAttributes, className, setTimeout } ) {
	const { footnotes } = attributes;
	const ref = useRef( null );
	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );
	const [ selected, select ] = useState( false );

	if ( ! footnotes.length ) {
		return null;
	}

	const hasSelection = footnotes.some( ( { isSelected } ) => isSelected );
	const viewAll = () => {
		ref.current.focus();
		clearSelectedBlock();
		// Wait for footnotes to be recalculated after the DOM change.
		setTimeout( () =>
			// Wait for DOM to update.
			setTimeout( () => ref.current.scrollIntoView() )
		);
	};

	const onFocus = () => {
		clearSelectedBlock();
		select( true );
	};

	const onBlur = () => {
		select( false );
	};

	return (
		<div
			className={ classnames( 'wp-block block-library-list', className, {
				'is-selected': hasSelection,
			} ) }
			tabIndex="0"
			onFocus={ onFocus }
			onBlur={ onBlur }
			ref={ ref }
		>
			{ hasSelection &&
				<>
					<Toolbar>
						<IconButton icon="editor-ol" onClick={ viewAll }>
							View all Footnotes
						</IconButton>
						<Slot name="__unstable-footnote-controls" />
					</Toolbar>
					{ selected && <BlockFormatControls.Slot /> }
				</>
			}
			<ol>
				{ footnotes.map( ( { id, text, isSelected }, index ) =>
					<li
						key={ id }
						id={ id }
						className={ classnames( { 'is-selected': isSelected } ) }
					>
						{ /* Needed for alignment. */ }
						<div>
							<a
								href={ `#${ id }-anchor` }
								aria-label={ __( 'Back to content' ) }
								onClick={ () => {
									// This is a hack to get the target to focus.
									// The attribute will later be removed when selection is set.
									document.getElementById( `${ id }-anchor` ).contentEditable = 'false';
								} }
							>
								↑
							</a>
							{ ' ' }
							<RichText.Bare
								value={ text }
								onChange={ ( value ) => {
									setAttributes( {
										footnotes: footnotes.map( ( footnote, i ) => {
											if ( i !== index ) {
												return footnote;
											}

											return {
												...footnote,
												text: value,
											};
										} ),
									} );
								} }
								placeholder={ __( 'Footnote' ) }
							/>
						</div>
					</li>
				) }
			</ol>
		</div>
	);
}

export default withSafeTimeout( Edit );
