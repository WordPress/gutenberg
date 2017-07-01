/**
 * WordPress dependencies
 */
import { Placeholder } from 'components';
import { __ } from 'i18n';

/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * Internal dependencies
 */
import './block.scss';
import './style.scss';
import { registerBlockType, query } from '../../api';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import ChatTranscript from './chat-transcript';

const { html } = query;

registerBlockType( 'core/chat', {
	title: __( 'Chat' ),

	icon: 'format-chat',

	category: 'formatting',

	attributes: {
		content: html(),
	},

	defaultAttributes: {
		compact: false,
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { compact, content } = attributes;

		const toggleCompact = () => setAttributes( { compact: ! compact } );

		return [
			focus && (
				<InspectorControls key="inspector">
					<ToggleControl
						label={ __( 'Compact display' ) }
						checked={ !! compact }
						onChange={ toggleCompact }
					/>
				</InspectorControls>
			),
			focus && (
				<Placeholder
					key="placeholder"
					icon="format-chat"
					label={ __( 'Chat Transcript' ) }
					className={ className }>
					<TextareaAutosize
						value={ content }
						onFocus={ setFocus }
						onChange={ ( event ) => setAttributes( { content: event.target.value } ) }
						placeholder={ __( 'Paste transcript here…' ) }
					/>
				</Placeholder>
			),
			! focus && (
				<ChatTranscript value={ content } compact={ compact } />
			),
		];
	},

	save( { attributes } ) {
		const { compact, content } = attributes;

		return <ChatTranscript value={ content } compact={ compact } />;
	},
} );
