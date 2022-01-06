/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function CodeEditorScreen( {
	className,
	onExit,
	exitShortcut,
	children,
} ) {
	return (
		<div
			className={ classnames(
				'interface-code-editor-screen',
				className
			) }
		>
			{ onExit && (
				<div className="interface-code-editor-screen__toolbar">
					<h2>{ __( 'Editing code' ) }</h2>
					<Button
						variant="tertiary"
						onClick={ onExit }
						shortcut={ exitShortcut }
					>
						{ __( 'Exit code editor' ) }
					</Button>
				</div>
			) }
			<div className="interface-code-editor-screen__body">
				{ children }
			</div>
		</div>
	);
}
