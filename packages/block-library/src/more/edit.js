/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { ENTER } from '@wordpress/keycodes';
import { getDefaultBlockName, createBlock } from '@wordpress/blocks';

const DEFAULT_TEXT = __( 'Read more' );

export default function MoreEdit( {
	// Before refactoring we allowed saving empty customText with an `undefined` value
	// but we misleadingly were showing the DEFAULT_TEXT.
	// So for backwards compatibility we set the same Default value to custom text.
	attributes: { customText = DEFAULT_TEXT, noTeaser },
	insertBlocksAfter,
	setAttributes,
} ) {
	const onChangeInput = ( event ) => {
		setAttributes( { customText: event.target.value } );
	};

	const onKeyDown = ( { keyCode } ) => {
		if ( keyCode === ENTER ) {
			insertBlocksAfter( [ createBlock( getDefaultBlockName() ) ] );
		}
	};

	const onBlur = () => {
		if ( ! customText ) {
			setAttributes( { customText: DEFAULT_TEXT } );
		}
	};

	const getHideExcerptHelp = ( checked ) =>
		checked
			? __( 'The excerpt is hidden.' )
			: __( 'The excerpt is visible.' );

	const toggleHideExcerpt = () => setAttributes( { noTeaser: ! noTeaser } );
	const style = { width: `${ customText.length + 1.2 }em` };

	return (
		<>
			<InspectorControls>
				<PanelBody>
					<ToggleControl
						label={ __(
							'Hide the excerpt on the full content page'
						) }
						checked={ !! noTeaser }
						onChange={ toggleHideExcerpt }
						help={ getHideExcerptHelp }
					/>
				</PanelBody>
			</InspectorControls>
			<div className="wp-block-more">
				<input
					type="text"
					value={ customText }
					onChange={ onChangeInput }
					onKeyDown={ onKeyDown }
					onBlur={ onBlur }
					style={ style }
				/>
			</div>
		</>
	);
}
