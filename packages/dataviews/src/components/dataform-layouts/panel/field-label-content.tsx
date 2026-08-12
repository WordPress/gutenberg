import { Icon as WCIcon } from '@wordpress/components';
import { error as errorIcon } from '@wordpress/icons';
import { Tooltip, VisuallyHidden } from '@wordpress/ui';

function FieldLabelContent( {
	showError,
	errorMessage,
	fieldLabel,
	onErrorClick,
}: {
	showError?: boolean;
	errorMessage?: string;
	fieldLabel?: string;
	onErrorClick?: () => void;
} ) {
	if ( ! showError ) {
		return <>{ fieldLabel }</>;
	}

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				onClick={ onErrorClick }
				render={
					<span className="dataforms-layouts-panel__field-label-error-content">
						<WCIcon icon={ errorIcon } size={ 16 } />
						<VisuallyHidden>{ errorMessage }: </VisuallyHidden>
						{ fieldLabel }
					</span>
				}
			/>
			<Tooltip.Popup>{ errorMessage }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

export default FieldLabelContent;
