/**
 * WordPress
 */
import { __ } from '@wordpress/i18n';
import ResizableBox from 're-resizable';

/**
 * Internal dependencies
 */
import './editor.scss';
import InspectorControls from '../../inspector-controls';

export const name = 'core/spacer';

export const settings = {
	title: __( 'Spacer' ),

	description: __( 'Add an element with empty space and custom height.' ),

	icon: 'image-flip-vertical',

	category: 'layout',

	attributes: {
		height: {
			type: 'number',
			default: 100,
		},
	},

	edit( { attributes, setAttributes, isSelected, toggleSelection } ) {
		const { height } = attributes;

		return [
			<ResizableBox
				size={ {
					height,
				} }
				minHeight="20"
				handleClasses={ {
					top: 'wp-block-spacer__resize-handler-top',
					bottom: 'wp-block-spacer__resize-handler-bottom',
				} }
				enable={ {
					top: true,
					right: false,
					bottom: true,
					left: false,
					topRight: false,
					bottomRight: false,
					bottomLeft: false,
					topLeft: false,
				} }
				onResizeStop={ ( event, direction, elt, delta ) => {
					setAttributes( {
						height: parseInt( height + delta.height, 10 ),
					} );
					toggleSelection( true );
				} }
				onResizeStart={ () => {
					toggleSelection( false );
				} }
				key="spacer"
			/>,
			isSelected &&
			<InspectorControls key="inspector">
				<input
					type="number"
					onChange={ ( event ) => {
						setAttributes( {
							height: parseInt( event.target.value, 10 ),
						} );
					} }
					aria-label={ __( 'Height for the spacer element in pixels.' ) }
					value={ height }
					min="20"
					step="10"
				/>
			</InspectorControls>,
		];
	},

	save( { attributes } ) {
		return <div style={ { height: attributes.height } } aria-hidden />;
	},
};
