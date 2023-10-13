export default function FieldFilters({ view, dataView }) {
    return (
        Object.keys(view.filters).map((key) => {
            const field = dataView
                .getAllColumns()
                .find(
                    (column) =>
                        column.columnDef.renderFilter &&
                        column.id === key
                );
            if (!field) {
                return null;
            }

            return field.columnDef.renderFilter();
        })
    );
}