/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, Button } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Context preview component.
 *
 * @param {Object} props        Component props.
 * @param {Object} props.packet Context packet data.
 * @return {JSX.Element} Context preview.
 */
export default function ContextPreview( { packet } ) {
	const [ copied, setCopied ] = useState( false );

	const copyRef = useCopyToClipboard( packet?.packet_text || '', () => {
		setCopied( true );
		setTimeout( () => setCopied( false ), 2000 );
	} );

	if ( ! packet ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Context Preview' ) } initialOpen={ false }>
			<div className="content-guidelines-context-preview">
				<p className="content-guidelines-context-preview__description">
					{ __( 'This is what would be sent to AI as context:' ) }
				</p>

				<div className="content-guidelines-context-preview__meta">
					{ packet.guidelines_id && (
						<span>
							{ __( 'Guidelines ID:' ) } { packet.guidelines_id }
						</span>
					) }
					{ packet.revision_id && (
						<span>
							{ __( 'Revision:' ) } { packet.revision_id }
						</span>
					) }
					{ packet.updated_at && (
						<span>
							{ __( 'Updated:' ) }{ ' ' }
							{ new Date(
								packet.updated_at
							).toLocaleDateString() }
						</span>
					) }
				</div>

				<pre className="content-guidelines-context-preview__text">
					{ packet.packet_text || __( '(Empty)' ) }
				</pre>

				<div className="content-guidelines-context-preview__actions">
					<Button ref={ copyRef } variant="secondary" size="small">
						{ copied ? __( 'Copied!' ) : __( 'Copy' ) }
					</Button>
				</div>

				{ packet.packet_structured && (
					<details className="content-guidelines-context-preview__structured">
						<summary>{ __( 'Structured data' ) }</summary>
						<pre>
							{ JSON.stringify(
								packet.packet_structured,
								null,
								2
							) }
						</pre>
					</details>
				) }
			</div>
		</PanelBody>
	);
}
