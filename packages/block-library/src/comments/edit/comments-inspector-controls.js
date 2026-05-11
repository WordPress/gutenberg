/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

export default function CommentsInspectorControls( {
	attributes: { tagName },
	setAttributes,
} ) {
	return (
		<InspectorControls>
			<InspectorControls group="advanced">
				<HTMLElementControl
					tagName={ tagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
				/>
			</InspectorControls>
		</InspectorControls>
	);
}
