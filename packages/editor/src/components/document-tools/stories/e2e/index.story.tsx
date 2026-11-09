import { Toolbar, ToolbarButton } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import editorStyles from '../../style.scss?inline';
import widgetsStyles from '../../../../../../edit-widgets/src/components/header/style.scss?inline';
import customizerStyles from '../../../../../../customize-widgets/src/components/header/style.scss?inline';

export default {
	title: 'Editor/Header toolbars',
};

export function Pressed() {
	return (
		<>
			<style>{ editorStyles + widgetsStyles + customizerStyles }</style>
			{ [
				[
					'Editor',
					'editor-document-tools',
					'editor-document-tools__left',
				],
				[ 'Widgets', 'edit-widgets-header-toolbar', '' ],
				[ 'Customizer', 'customize-widgets-header-toolbar', '' ],
			].map( ( [ label, className, groupClassName ] ) => {
				const buttons = [ false, true ].map( ( disabled ) => (
					<ToolbarButton
						key={ String( disabled ) }
						icon={ plus }
						title={ disabled ? 'Disabled' : 'Enabled' }
						variant="primary"
						isPressed
						disabled={ disabled }
					/>
				) );
				return (
					<section key={ label }>
						<h3>{ label }</h3>
						<Toolbar label={ label } className={ className }>
							{ groupClassName ? (
								<div className={ groupClassName }>
									{ buttons }
								</div>
							) : (
								buttons
							) }
						</Toolbar>
					</section>
				);
			} ) }
		</>
	);
}
