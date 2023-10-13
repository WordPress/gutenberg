export default function FieldFilters({ view, fields }) {
    return (
        Object.keys(view.filters).map((key) => {
            const fieldWithFilter = fields
                .find(
                    ( field ) =>
                        field.renderFilter &&
                        field.id === key
                );
            if (!fieldWithFilter) {
                return null;
            }

            return fieldWithFilter.renderFilter();
        })
    );
}