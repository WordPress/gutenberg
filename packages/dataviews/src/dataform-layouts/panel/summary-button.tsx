/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { sprintf, _x, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

function SummaryButton< Item >( {
	summaryFields,
	data,
	labelPosition,
	fieldLabel,
	disabled,
	onClick,
	'aria-expanded': ariaExpanded,
}: {
	summaryFields: NormalizedField< Item >[];
	data: Item;
	labelPosition: 'side' | 'top' | 'none';
	fieldLabel?: string;
	disabled?: boolean;
	onClick: () => void;
	'aria-expanded'?: boolean;
} ) {
	const isEmpty =
		labelPosition === 'none' &&
		summaryFields.every( ( summaryField ) => {
			const value = summaryField.getValue( { item: data } );
			return value === undefined || value === null || value === '';
		} );

	let summaryContent;
	if ( isEmpty ) {
		summaryContent = __( '(Empty field)' );
	} else if ( summaryFields.length > 1 ) {
		summaryContent = (
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-start',
					width: '100%',
					gap: '2px',
				} }
			>
				{ summaryFields.map( ( summaryField ) => (
					<div key={ summaryField.id } style={ { width: '100%' } }>
						<summaryField.render
							item={ data }
							field={ summaryField }
						/>
					</div>
				) ) }
			</div>
		);
	} else {
		summaryContent = summaryFields.map( ( summaryField ) => (
			<summaryField.render
				key={ summaryField.id }
				item={ data }
				field={ summaryField }
			/>
		) );
	}

	return (
		<Button
			className="dataforms-layouts-panel__summary-button"
			size="compact"
			variant={
				[ 'none', 'top' ].includes( labelPosition )
					? 'link'
					: 'tertiary'
			}
			aria-expanded={ ariaExpanded }
			aria-label={ sprintf(
				// translators: %s: Field name.
				_x( 'Edit %s', 'field' ),
				fieldLabel || ''
			) }
			onClick={ onClick }
			disabled={ disabled }
			accessibleWhenDisabled
			style={
				summaryFields.length > 1
					? {
							minHeight: 'auto',
							height: 'auto',
							alignItems: 'flex-start',
					  }
					: undefined
			}
		>
			{ summaryContent }
		</Button>
	);
}

export default SummaryButton;
