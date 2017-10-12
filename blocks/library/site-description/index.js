/**
 * WordPress dependencies
 */
import { Placeholder, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';
import BlockControls from '../../block-controls';

registerBlockType( 'core/site-description', {
	title: __( 'Site Description' ),

	icon: 'list-view',

	category: 'widgets',

	attributes: {
		description: {
			type: 'string',
			option: 'description',
		},
		shouldRenderDescription: {
			type: 'boolean',
			default: false,
		},
	},

	keywords: [ __( 'site tagline' ) ],

	edit( { attributes, setAttributes, focus } ) {
		const {
			description,
			shouldRenderDescription,
		} = attributes;

		if ( description === undefined ) {
			return (
				<Placeholder
					icon="admin-post"
					label={ __( 'Site Description' ) }
				>
					<Spinner />
				</Placeholder>
			);
		}

		return [
			focus && <BlockControls key="controls" />,
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'Shows your site\'s description' ) }</p>
					</BlockDescription>
					<InspectorControls.ToggleControl
						label={ __( 'Render description' ) }
						checked={ shouldRenderDescription }
						onChange={ () => setAttributes( {
							shouldRenderDescription: ! shouldRenderDescription,
						} ) }
					/>
				</InspectorControls>
			),
			<input key="site-title"
				className="wp-block-site-description"
				onChange={ ( event ) => setAttributes( {
					description: event.target.value,
				} ) }
				value={ description } />,
		];
	},

	save( { attributes } ) {
		const { description, shouldRenderDescription } = attributes;
		return shouldRenderDescription
			? <div>{ description }</div>
			: null;
	},
} );
