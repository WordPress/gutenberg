import { Icon as WCIcon } from '@wordpress/components';
import { error as errorIcon } from '@wordpress/icons';
import { VisuallyHidden } from '@wordpress/ui';

function FieldLabelContent( {
	showError,
	errorMessage,
	fieldLabel,
	errorId,
}: {
	showError?: boolean;
	errorMessage?: string;
	fieldLabel?: string;
	errorId: string;
} ) {
	if ( ! showError ) {
		return <>{ fieldLabel }</>;
	}

	return (
		<span className="dataforms-layouts-panel__field-label-error-content">
			<WCIcon icon={ errorIcon } size={ 16 } />
			<VisuallyHidden id={ errorId }>{ errorMessage }</VisuallyHidden>
			{ fieldLabel }
		</span>
	);
}

export default FieldLabelContent;
