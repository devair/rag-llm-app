import type { JobStatusType } from "../../../types/api"


interface StatusBadgeProps {
    status: JobStatusType | string   // aceita status desconhecido retornado pelo backend
}

interface BadgeStyle {
    label: string
    className: string
}


// Mapa status -> rótulo/classe (Liskov: componentes filhos são intercambiáveis;
// Open/Closed: novos status só precisam de uma nova entrada no mapa).


const DEFAULT_BADGE: BadgeStyle = { label: 'Desconhecido', className: 'badge badge-pending' }

const STATUS_LABELS: Record<string, BadgeStyle> = {
    COMPLETED: { label: 'Concluído', className: 'badge badge-success' },
    PROCESSING: { label: 'Processando...', className: 'badge badge-processing' },
    FAILED: { label: 'Falhou', className: 'badge badge-failed' },
    PENDING: DEFAULT_BADGE,
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const { label, className } = STATUS_LABELS[status] ?? DEFAULT_BADGE
    return <span className={className}>{label}</span>
}