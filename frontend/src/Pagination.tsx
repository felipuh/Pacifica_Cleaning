export type PaginationState = {
  page: number;
  pageSize: number;
  count: number;
};

export function Pagination({ state, onChange }: { state: PaginationState; onChange: (page: number, pageSize: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(state.count / state.pageSize));
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    const start = Math.max(1, Math.min(state.page - 2, totalPages - 4));
    return start + index;
  });
  return (
    <nav className="pagination" aria-label="Paginación de resultados">
      <span>Página {state.page} de {totalPages} · {state.count} registros</span>
      <button type="button" className="ghost" disabled={state.page <= 1} onClick={() => onChange(state.page - 1, state.pageSize)} aria-label="Página anterior">Anterior</button>
      <div className="page-buttons" aria-label="Páginas disponibles">
        {pages.map((page) => <button type="button" className={page === state.page ? "active" : "ghost"} aria-current={page === state.page ? "page" : undefined} key={page} onClick={() => onChange(page, state.pageSize)}>{page}</button>)}
      </div>
      <button type="button" className="ghost" disabled={state.page >= totalPages || state.count === 0} onClick={() => onChange(state.page + 1, state.pageSize)} aria-label="Página siguiente">Siguiente</button>
      <label>Por página<select aria-label="Registros por página" value={state.pageSize} onChange={(event) => onChange(1, Number(event.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label>
    </nav>
  );
}
