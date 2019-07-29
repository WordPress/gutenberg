/**
 * External dependencies
 */
import { castArray } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Disabled } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';

/**
 * Block Preview Component: It renders a preview given a block name and attributes.
 *
 * @param {Object} props Component props.
 *
 * @return {WPElement} Rendered element.
 */
function BlockPreview( { blocks, settings, className, isScaled } ) {
	if ( ! blocks ) {
		return null;
	}
	return (
		<Disabled
			aria-hidden
			className={ classnames(
				'editor-block-preview',
				'block-editor-block-preview',
				'editor-styles-wrapper',
				className,
				{
					'is-scaled': isScaled,
				}
			) }
		>
			<BlockEditorProvider
				value={ castArray( blocks ) }
				settings={ settings }
			>
				<BlockList />
			</BlockEditorProvider>
		</Disabled>
	);
}

export default withSelect( ( select ) => {
	return {
		settings: select( 'core/block-editor' ).getSettings(),
	};
} )( BlockPreview );
