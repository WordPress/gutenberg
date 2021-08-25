/**
 * Internal dependencies
 */

export interface OwnProps {
	show: boolean;
	proceed: ( flag: boolean ) => void;
	confirmation: React.ReactNode;
}
