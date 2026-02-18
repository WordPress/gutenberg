/**
 * WordPress dependencies
 */
import { BaseControl, Icon, Tooltip } from '@wordpress/components';
import { error as errorIcon } from '@wordpress/icons';

function getLabelContent(
	showError?: boolean,
	errorMessage?: string,
	fieldLabel?: string
) {
	return showError ? (
		<Tooltip text={ errorMessage } placement="top">
			<span className="dataforms-layouts-panel__field-label-error-content">
				<Icon icon={ errorIcon } size={ 16 } />
				<BaseControl.VisualLabel>
					{ fieldLabel }
				</BaseControl.VisualLabel>
			</span>
		</Tooltip>
	) : (
		<BaseControl.VisualLabel>{ fieldLabel }</BaseControl.VisualLabel>
	);
}

export default getLabelContent;
