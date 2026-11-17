import { cn } from "../../utils/cn";

export default function Pagination() {
  return (
    <nav
      className="mt-14 flex justify-center gap-3"
      aria-label="페이지"
    >
      {[1, 2, 3, 4, 5].map((page) => (
        <span
          key={page}
          className={cn(
            "grid size-9 place-items-center",
            page === 1
              ? "rounded-full bg-[#f42b45] text-white"
              : "text-[#aaa]",
          )}
          aria-current={
            page === 1 ? "page" : undefined
          }
        >
          {page}
        </span>
      ))}
    </nav>
  );
}