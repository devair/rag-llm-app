import type { ReactNode } from "react"

interface CardProps {
    title: string
    className?: string
    children?: ReactNode
}

/** Cartão genérico reutilizável (SRP / DRY): remove a repetição do padrão card+titulo. */
export function Card({ title, className, children }: CardProps) {
    return (
        <div className={`card ${className}`.trim()}>
            <h2>{title}</h2>
            {children}
        </div>
    )
}