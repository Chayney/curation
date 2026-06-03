import { useState } from "react";

export const usePagination = <T,>(
    items: T[],
    perPage: number = 10
) => {
    const [page, setPage] = useState<number>(1);

    const start = (page - 1) * perPage;

    const paginated = items.slice(start, start + perPage);

    return {
        page,
        setPage,
        paginated,
        totalPages: Math.ceil(items.length / perPage)
    };
};