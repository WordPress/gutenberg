export type RadioGroupProps = {
	label: string;
	checked?: string | number;
	defaultChecked?: string | number;
	disabled?: boolean;
	onChange?: ( value: string | number | undefined ) => void;
	children: React.ReactNode;
};

export type RadioProps = {
	value: string | number;
	children?: React.ReactNode;
};
