// 独自のページネーション
import styles from "./style.module.css";
import { Button } from "../../ui/button";

type Props = {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    maxVisiblePages?: number;
};

export const Pagination = ({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    maxVisiblePages = 5,
}: Props) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    let startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2)
    );

    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const visiblePages = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
    );

    return (
        <div className={styles.pagination}>
            {/* Prev */}
            <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                Prev
            </Button>

            {/* Pages */}
            {visiblePages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={
                        currentPage === page
                            ? styles.activePage
                            : styles.pageButton
                    }
                >
                    {page}
                </button>
            ))}

            {/* Next */}
            <Button
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next
            </Button>
        </div>
    );
}