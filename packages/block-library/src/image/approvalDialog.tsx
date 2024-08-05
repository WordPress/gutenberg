/**
 * External dependencies
 */
import {
	ReactCompareSlider,
	ReactCompareSliderImage,
} from 'react-compare-slider'; // eslint-disable-line import/no-unresolved

/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as uploadStore } from '@wordpress/upload-media';

const numberFormatter = Intl.NumberFormat( 'en', {
	notation: 'compact',
	style: 'unit',
	unit: 'byte',
	unitDisplay: 'narrow',
	// @ts-ignore
	roundingPriority: 'lessPrecision',
	maximumSignificantDigits: 2,
	maximumFractionDigits: 2,
} );

const diffFormatter = Intl.NumberFormat( 'en', {
	notation: 'compact',
	style: 'percent',
	maximumFractionDigits: 2,
} );

interface ApprovalDialogProps {
	id: number;
}

export function ApprovalDialog( { id }: ApprovalDialogProps ) {
	const { isPendingApproval, comparison } = useSelect(
		( select ) => ( {
			// This allows showing only one approval modal at a time if there
			// are multiple pending items.
			isPendingApproval: id
				? select( uploadStore ).isFirstPendingApprovalByAttachmentId(
						id
				  )
				: false,
			comparison: id
				? select( uploadStore ).getComparisonDataForApproval( id )
				: null,
		} ),
		[ id ]
	);

	const { rejectApproval, grantApproval } = useDispatch( uploadStore );
	const [ , setOpen ] = useState( false );
	const closeModal = () => setOpen( false );
	const onApprove = () => {
		closeModal();
		void grantApproval( id );
	};

	const onReject = () => {
		closeModal();
		void rejectApproval( id );
	};

	if ( ! isPendingApproval || ! comparison ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Compare media quality' ) }
			onRequestClose={ onReject }
		>
			<div className="compression-comparison-modal__labels">
				<p>
					{ sprintf(
						/* translators: %s: file size. */
						__( 'Old version: %s' ),
						numberFormatter.format( comparison.oldSize )
					) }
				</p>
				<p>
					{ sprintf(
						/* translators: %s: file size. */
						__( 'New version: %s' ),
						numberFormatter.format( comparison.newSize )
					) }
				</p>
			</div>
			<p>
				{ createInterpolateElement(
					comparison.sizeDiff < 0
						? sprintf(
								/* translators: %s: file size decrease in percent. */
								__( 'The new version is <b>%s smaller</b>!' ),
								diffFormatter.format( comparison.sizeDiff )
						  )
						: sprintf(
								/* translators: %s: file size increase in percent. */
								__( 'The new version is <b>%s bigger</b> :(' ),
								diffFormatter.format( comparison.sizeDiff )
						  ),
					{
						b: <b />,
					}
				) }
			</p>
			<div className="compression-comparison-modal__slider">
				<ReactCompareSlider
					itemOne={
						<ReactCompareSliderImage
							src={ comparison.oldUrl }
							alt={ __( 'Original version' ) }
						/>
					}
					itemTwo={
						<ReactCompareSliderImage
							src={ comparison.newUrl }
							alt={ __( 'Optimized version' ) }
						/>
					}
				/>
			</div>
			<div className="compression-comparison-modal__buttons">
				<Button variant="primary" onClick={ onApprove }>
					{ __( 'Use optimized version' ) }
				</Button>
				<Button variant="secondary" onClick={ onReject }>
					{ __( 'Cancel' ) }
				</Button>
			</div>
		</Modal>
	);
}
