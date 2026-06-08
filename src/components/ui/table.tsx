import React from 'react'

export interface TableProps {
  headers: string[]
  children: React.ReactNode
  isEmpty?: boolean
  emptyMessage?: string
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  isEmpty = false,
  emptyMessage = 'No items found.',
}) => {
  return (
    <div className="w-full overflow-x-auto border border-border rounded-xl bg-surface-2/20">
      <table className="w-full border-collapse text-left text-sm text-text-2">
        <thead className="bg-surface-2/50 text-text-2 font-medium border-b border-border text-xs uppercase tracking-wider">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-text-3 font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}

export const TableRow: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-surface-2/40 hover:text-text-1 transition-colors cursor-default ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  )
}

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <td className={`px-6 py-4 align-middle ${className}`}>{children}</td>
}
