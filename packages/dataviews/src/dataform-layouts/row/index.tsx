/**
 * WordPress dependencies
 */
import { __experimentalHeading as Heading } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type {
	FieldLayoutProps,
	NormalizedForm,
	NormalizedLayout,
	NormalizedRowLayout,
} from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import { getFormFieldLayout } from '..';

function Header( { title }: { title: string } ) {
	return (
		<Stack
			direction="column"
			className="dataforms-layouts-row__header"
			gap="md"
		>
			<Stack direction="row" align="center">
				<Heading level={ 2 } size={ 13 }>
					{ title }
				</Heading>
			</Stack>
		</Stack>
	);
}

const EMPTY_WRAPPER = ( { children }: { children: React.ReactNode } ) => (
	<>{ children }</>
);

export default function FormRowField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: FieldLayoutProps< Item > ) {
	const layout = field.layout as NormalizedRowLayout;

	if ( !! field.children ) {
		const form: NormalizedForm = {
			layout: DEFAULT_LAYOUT as NormalizedLayout,
			fields: field.children,
		};

		return (
			<div className="dataforms-layouts-row__field">
				{ ! hideLabelFromVision && field.label && (
					<Header title={ field.label } />
				) }
				<Stack direction="row" align={ layout.alignment } gap="md">
					<DataFormLayout
						data={ data }
						form={ form }
						onChange={ onChange }
						validity={ validity?.children }
						as={ EMPTY_WRAPPER }
					>
						{ ( FieldLayout, childField, childFieldValidity ) => (
							<div
								key={ childField.id }
								className="dataforms-layouts-row__field-control"
								style={ layout.styles[ childField.id ] }
							>
								<FieldLayout
									data={ data }
									field={ childField }
									onChange={ onChange }
									hideLabelFromVision={ hideLabelFromVision }
									validity={ childFieldValidity }
								/>
							</div>
						) }
					</DataFormLayout>
				</Stack>
			</div>
		);
	}

	const RegularLayout = getFormFieldLayout( 'regular' )?.component;
	if ( ! RegularLayout ) {
		return null;
	}

	return (
		<>
			<div className="dataforms-layouts-row__field-control">
				<RegularLayout
					data={ data }
					field={ field }
					onChange={ onChange }
					validity={ validity }
				/>
			</div>
		</>
	);
}
